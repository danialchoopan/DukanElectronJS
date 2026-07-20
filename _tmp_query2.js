const initSqlJs = require('sql.js/dist/sql-asm.js');
const fs = require('fs');

const DB_PATH = 'C:\\Users\\daniru\\.local\\share\\mimocode\\mimocode.db';
const PROJ_ID = '5af8ade2-d5cf-4e86-9a11-db5d6f5c878d';

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buf);

  // Get all sessions (not just checkpoint writers), newest first
  const sessions = db.exec(`SELECT id, title, time_created, time_updated FROM session WHERE project_id='${PROJ_ID}' AND title NOT LIKE '%checkpoint-writer%' ORDER BY time_created DESC LIMIT 25`);
  console.log("=== WORK SESSIONS (non-checkpoint-writer) ===");
  if (sessions.length > 0) {
    for (const row of sessions[0].values) {
      const created = new Date(row[2] * 1000).toISOString();
      const updated = new Date(row[3] * 1000).toISOString();
      const title = row[1].substring(0, 100);
      console.log(`  ${row[0]} | ${created} → ${updated} | ${title}`);
    }
  }

  // Get message counts per session (last 30 days)
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 86400;
  const msgCounts = db.exec(`
    SELECT m.session_id, COUNT(*) as msg_count
    FROM message m
    JOIN session s ON s.id = m.session_id
    WHERE s.project_id = '${PROJ_ID}'
      AND s.time_created > ${thirtyDaysAgo}
    GROUP BY m.session_id
    ORDER BY msg_count DESC
  `);
  console.log("\n=== MESSAGE COUNTS (last 30 days) ===");
  if (msgCounts.length > 0) {
    for (const row of msgCounts[0].values) {
      console.log(`  ${row[0]}: ${row[1]} messages`);
    }
  }

  db.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
