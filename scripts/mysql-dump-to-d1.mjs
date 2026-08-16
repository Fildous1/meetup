// Převede mysqldump (Aiven MySQL) na SQL, které spolkne D1/SQLite.
//
//   node scripts/mysql-dump-to-d1.mjs <dump.sql> [vystup.sql]
//   npx wrangler d1 execute meetup-db --remote --file=./d1-import.sql
//
// Bere jen INSERTy do events/responses, zachovává původní id (kvůli vazbě
// responses.event_id) a přepisuje MySQL escapování na SQLite.

import { readFileSync, writeFileSync } from 'node:fs'

const TABLES = {
  events: {
    columns: ['id', 'code', 'name', 'description', 'creator_name', 'creator_email', 'date_from', 'date_to', 'created_at'],
    required: ['code', 'name', 'date_from', 'date_to'],
  },
  responses: {
    columns: ['id', 'event_id', 'participant_name', 'availability', 'comment', 'updated_at'],
    required: ['event_id', 'participant_name', 'availability'],
  },
}

const MYSQL_ESCAPES = {
  '0': '\0', "'": "'", '"': '"', b: '\b', n: '\n', r: '\r', t: '\t', Z: '\x1a', '\\': '\\', '%': '%', _: '_',
}

const [, , inputPath, outputPath = 'd1-import.sql'] = process.argv

if (!inputPath) {
  console.error('Použití: node scripts/mysql-dump-to-d1.mjs <dump.sql> [vystup.sql]')
  process.exit(1)
}

const dump = readFileSync(inputPath, 'utf8')
const lines = ['-- Vygenerováno z ' + inputPath, 'PRAGMA defer_foreign_keys = true;']
const counts = {}

for (const insert of extractInserts(dump)) {
  const table = TABLES[insert.table]
  if (!table) continue

  const columns = insert.columns ?? table.columns
  const kept = columns.map((column, index) => ({ column, index })).filter(({ column }) => table.columns.includes(column))

  const missing = table.required.filter((column) => !kept.some((k) => k.column === column))
  if (missing.length > 0) {
    console.error(`Tabulka ${insert.table}: v dumpu chybí sloupce ${missing.join(', ')}`)
    process.exit(1)
  }

  for (const row of insert.rows) {
    const values = kept.map(({ index }) => quote(row[index]))
    lines.push(`INSERT INTO ${insert.table} (${kept.map((k) => k.column).join(', ')}) VALUES (${values.join(', ')});`)
    counts[insert.table] = (counts[insert.table] ?? 0) + 1
  }
}

writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8')
console.log(`Zapsáno do ${outputPath}:`)
for (const [table, count] of Object.entries(counts)) console.log(`  ${table}: ${count} řádků`)
if (Object.keys(counts).length === 0) console.warn('  (žádné INSERTy do events/responses nenalezeny)')

function extractInserts(sql) {
  const inserts = []
  const header = /INSERT\s+(?:IGNORE\s+)?INTO\s+`?(\w+)`?\s*(?:\(([^)]*)\))?\s*VALUES/gi
  let match

  while ((match = header.exec(sql)) !== null) {
    const columns = match[2]
      ? match[2].split(',').map((column) => column.trim().replace(/^`|`$/g, ''))
      : null
    const { rows, end } = parseRows(sql, header.lastIndex)
    inserts.push({ table: match[1], columns, rows })
    header.lastIndex = end
  }

  return inserts
}

/** Načte seznam n-tic za VALUES až po ukončující středník. */
function parseRows(sql, start) {
  const rows = []
  let i = start

  for (;;) {
    while (i < sql.length && /[\s,]/.test(sql[i])) i++
    if (sql[i] !== '(') break

    const row = []
    i++

    for (;;) {
      while (i < sql.length && /\s/.test(sql[i])) i++
      if (sql[i] === ')') { i++; break }

      const value = readValue(sql, i)
      row.push(value.value)
      i = value.end

      while (i < sql.length && /\s/.test(sql[i])) i++
      if (sql[i] === ',') i++
    }

    rows.push(row)
  }

  while (i < sql.length && /\s/.test(sql[i])) i++
  if (sql[i] === ';') i++

  return { rows, end: i }
}

function readValue(sql, start) {
  if (sql[start] === "'") {
    let value = ''
    let i = start + 1

    while (i < sql.length) {
      const char = sql[i]
      if (char === '\\') {
        value += MYSQL_ESCAPES[sql[i + 1]] ?? sql[i + 1]
        i += 2
      } else if (char === "'" && sql[i + 1] === "'") {
        value += "'"
        i += 2
      } else if (char === "'") {
        return { value, end: i + 1 }
      } else {
        value += char
        i++
      }
    }

    throw new Error('Neuzavřený řetězec v dumpu')
  }

  let i = start
  while (i < sql.length && !/[,)]/.test(sql[i])) i++
  const raw = sql.slice(start, i).trim()

  return { value: /^null$/i.test(raw) ? null : raw, end: i }
}

function quote(value) {
  if (value === null || value === undefined) return 'NULL'
  if (/^-?\d+(\.\d+)?$/.test(value)) return value
  return `'${String(value).replaceAll("'", "''")}'`
}
