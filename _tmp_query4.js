const initSqlJs = require('sql.js/dist/sql-asm.js');
const fs = require('fs');

const DB_PATH = 'C:\\Users\\daniru\\.local\\share\\mimocode\\mimocode.db';

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buf);

  // Get recent user messages from main session (ses_11fb93db9ffeyYusarKBcu2XPb) - last 7 days
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 86400;
  
  // Get all user messages with real content (>100 chars, not system)
  const userMsgs = db.exec(`
    SELECT m.id, m.session_id, m.time_created, substr(json_extract(p.data, '$.text'), 1, 500) as text_preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id IN ('ses_11fb93db9ffeyYusarKBcu2XPb', 'ses_089151489ffexNZ1ELmRPJHsbm')
      AND json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND length(json_extract(p.data, '$.text')) > 100
      AND json_extract(p.data, '$.text') NOT LIKE '%checkpoint-writer%'
      AND json_extract(p.data, '$.text') NOT LIKE '%<system-reminder>%'
      AND m.time_created > ${sevenDaysAgo}
    ORDER BY m.time_created DESC
    LIMIT 30
  `);
  
  console.log("=== RECENT USER MESSAGES (7 days, >100 chars, no system) ===");
  if (userMsgs.length > 0) {
    for (const row of userMsgs[0].values) {
      const dt = new Date(row[2] * 1000).toISOString();
      const text = row[3].replace(/\n/g, ' ').substring(0, 400);
      console.log(`\n[${dt}] (${row[1]}):`);
      console.log(`  ${text}`);
    }
  } else {
    console.log("  (none found)");
  }

  // Also check for user messages with version/release keywords
  console.log("\n\n=== USER MESSAGES: version/release/build ===");
  const releaseMsgs = db.exec(`
    SELECT m.id, m.session_id, m.time_created, substr(json_extract(p.data, '$.text'), 1, 500) as text_preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id IN ('ses_11fb93db9ffeyYusarKBcu2XPb', 'ses_089151489ffexNZ1ELmRPJHsbm')
      AND json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') NOT LIKE '%<system-reminder>%'
      AND (lower(p.data) LIKE '%version%' OR lower(p.data) LIKE '%release%' OR lower(p.data) LIKE '%v1.%')
    ORDER BY m.time_created DESC
    LIMIT 15
  `);
  if (releaseMsgs.length > 0) {
    for (const row of releaseMsgs[0].values) {
      const dt = new Date(row[2] * 1000).toISOString();
      const text = row[3].replace(/\n/g, ' ').substring(0, 400);
      console.log(`\n[${dt}]:`);
      console.log(`  ${text}`);
    }
  }

  db.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
