const initSqlJs = require('sql.js/dist/sql-asm.js');
const fs = require('fs');

const DB_PATH = 'C:\\Users\\daniru\\.local\\share\\mimocode\\mimocode.db';

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buf);

  // Get the last 7 days of user messages (non-system, non-checkpoint-writer)
  // Focus on the current session ses_0812fe461ffeN3JHT6kRWpNTfI (Auto Dream) and the main fork ses_11fb93db9ffeyYusarKBcu2XPb
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - 7 * 86400;

  // Get user messages from ALL project sessions in the last 7 days
  const userMsgs = db.exec(`
    SELECT m.id, m.session_id, m.time_created, substr(json_extract(p.data, '$.text'), 1, 600) as text_preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    JOIN session s ON s.id = m.session_id
    WHERE s.project_id = '5af8ade2-d5cf-4e86-9a11-db5d6f5c878d'
      AND json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') NOT LIKE '%<system-reminder>%'
      AND length(json_extract(p.data, '$.text')) > 20
      AND m.time_created > ${sevenDaysAgo}
    ORDER BY m.time_created DESC
    LIMIT 20
  `);

  console.log("=== USER MESSAGES (ALL PROJECT SESSIONS, LAST 7 DAYS) ===");
  if (userMsgs.length > 0) {
    for (const row of userMsgs[0].values) {
      const dt = new Date(row[2] * 1000).toISOString();
      const text = row[3].replace(/\n/g, ' ').substring(0, 500);
      console.log(`\n[${dt}] (${row[1]}):`);
      console.log(`  ${text}`);
    }
  } else {
    console.log("  (none found in last 7 days)");
  }

  // Get assistant text responses from last 7 days for this project
  const assistantMsgs = db.exec(`
    SELECT m.id, m.session_id, m.time_created, substr(json_extract(p.data, '$.text'), 1, 500) as text_preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    JOIN session s ON s.id = m.session_id
    WHERE s.project_id = '5af8ade2-d5cf-4e86-9a11-db5d6f5c878d'
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'text'
      AND length(json_extract(p.data, '$.text')) > 200
      AND m.time_created > ${sevenDaysAgo}
    ORDER BY m.time_created DESC
    LIMIT 20
  `);

  console.log("\n\n=== ASSISTANT TEXT (LAST 7 DAYS) ===");
  if (assistantMsgs.length > 0) {
    for (const row of assistantMsgs[0].values) {
      const dt = new Date(row[2] * 1000).toISOString();
      const text = row[3].replace(/\n/g, ' ').substring(0, 450);
      console.log(`\n[${dt}] (${row[1]}):`);
      console.log(`  ${text}`);
    }
  } else {
    console.log("  (none found)");
  }

  db.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
