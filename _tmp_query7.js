const initSqlJs = require('sql.js/dist/sql-asm.js');
const fs = require('fs');

const DB_PATH = 'C:\\Users\\daniru\\.local\\share\\mimocode\\mimocode.db';

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buf);

  // Get messages from the most recent session (ses_11fb93db9ffeyYusarKBcu2XPb) 
  // with the latest user message about "run test make sure import and export works"
  const recentMsgs = db.exec(`
    SELECT m.id, json_extract(m.data, '$.role') as role, m.time_created, 
           substr(json_extract(p.data, '$.text'), 1, 800) as text_preview,
           json_extract(p.data, '$.type') as part_type
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_11fb93db9ffeyYusarKBcu2XPb'
      AND json_extract(p.data, '$.type') = 'text'
      AND m.time_created > 1781900000
    ORDER BY m.time_created ASC
    LIMIT 30
  `);

  console.log("=== LATEST SESSION MESSAGES (after Oct 19 2026) ===");
  if (recentMsgs.length > 0) {
    for (const row of recentMsgs[0].values) {
      const dt = new Date(row[2] * 1000).toISOString();
      const text = row[3].replace(/\n/g, ' ').substring(0, 700);
      console.log(`\n[${dt}] ${row[1]}:`);
      console.log(`  ${text}`);
    }
  } else {
    console.log("  (none found)");
  }

  // Also check for schemaMigration.ts content
  console.log("\n\n=== CHECK SCHEMA MIGRATION STATE ===");
  const migMsgs = db.exec(`
    SELECT substr(json_extract(p.data, '$.text'), 1, 600) as text_preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id IN ('ses_11fb93db9ffeyYusarKBcu2XPb')
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'text'
      AND lower(p.data) LIKE '%import%'
      AND lower(p.data) LIKE '%export%'
    ORDER BY m.time_created DESC
    LIMIT 5
  `);
  if (migMsgs.length > 0) {
    for (const row of migMsgs[0].values) {
      const text = row[0].replace(/\n/g, ' ').substring(0, 500);
      console.log(`  ${text}`);
    }
  }

  db.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
