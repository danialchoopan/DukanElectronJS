const initSqlJs = require('sql.js/dist/sql-asm.js');
const fs = require('fs');

const DB_PATH = 'C:\\Users\\daniru\\.local\\share\\mimocode\\mimocode.db';

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buf);

  // Search user messages for rule/decision keywords across ALL sessions for this project
  const keywords = ['always', 'never', 'remember', 'rule', 'must not', 'must be', 'should be', 'do not', 'important'];
  
  for (const kw of keywords) {
    const rows = db.exec(`
      SELECT m.id, m.session_id, m.time_created, substr(json_extract(p.data, '$.text'), 1, 300) as text_preview
      FROM message m
      JOIN part p ON p.message_id = m.id
      JOIN session s ON s.id = m.session_id
      WHERE s.project_id = '5af8ade2-d5cf-4e86-9a11-db5d6f5c878d'
        AND json_extract(m.data, '$.role') = 'user'
        AND json_extract(p.data, '$.type') = 'text'
        AND lower(p.data) LIKE '%${kw}%'
      ORDER BY m.time_created DESC
      LIMIT 10
    `);
    if (rows.length > 0 && rows[0].values.length > 0) {
      console.log(`\n=== USER MESSAGES containing "${kw}" ===`);
      for (const row of rows[0].values) {
        const dt = new Date(row[2] * 1000).toISOString();
        console.log(`  [${dt}] (${row[1]}) ${row[3]}`);
      }
    }
  }

  db.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
