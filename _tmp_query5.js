const initSqlJs = require('sql.js/dist/sql-asm.js');
const fs = require('fs');

const DB_PATH = 'C:\\Users\\daniru\\.local\\share\\mimocode\\mimocode.db';

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buf);

  // Get assistant text messages (not system) from the latest non-checkpoint session
  // The latest real work session appears to be ses_11fb93db9ffeyYusarKBcu2XPb (most recent user interaction)
  // and the most recent non-checkpoint title is ses_089151489ffexNZ1ELmRPJHsbm (fork #2)
  
  // Check what tasks were created in the most recent sessions
  const tasks = db.exec(`
    SELECT t.id, t.session_id, t.status, t.summary, t.created_at, t.ended_at
    FROM task t
    JOIN session s ON s.id = t.session_id
    WHERE s.project_id = '5af8ade2-d5cf-4e86-9a11-db5d6f5c878d'
    ORDER BY t.created_at DESC
    LIMIT 20
  `);
  
  console.log("=== RECENT TASKS ===");
  if (tasks.length > 0) {
    for (const row of tasks[0].values) {
      const created = new Date(row[4] * 1000).toISOString();
      console.log(`  [${created}] ${row[0]} (${row[2]}) session=${row[1]}: ${row[3]}`);
    }
  }

  // Get the latest git log state from assistant messages
  console.log("\n\n=== RECENT GIT/RELEASE MESSAGES (assistant) ===");
  const gitMsgs = db.exec(`
    SELECT m.id, m.session_id, m.time_created, substr(json_extract(p.data, '$.text'), 1, 400) as text_preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id IN ('ses_11fb93db9ffeyYusarKBcu2XPb', 'ses_089151489ffexNZ1ELmRPJHsbm')
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'text'
      AND (lower(p.data) LIKE '%release%' OR lower(p.data) LIKE '%version%' OR lower(p.data) LIKE '%migration%' OR lower(p.data) LIKE '%schema%')
    ORDER BY m.time_created DESC
    LIMIT 10
  `);
  if (gitMsgs.length > 0) {
    for (const row of gitMsgs[0].values) {
      const dt = new Date(row[2] * 1000).toISOString();
      const text = row[3].replace(/\n/g, ' ').substring(0, 350);
      console.log(`\n[${dt}]:`);
      console.log(`  ${text}`);
    }
  }

  // Check what the latest release/version is from the most recent session
  console.log("\n\n=== LATEST RELEASE INFO ===");
  const releaseInfo = db.exec(`
    SELECT substr(json_extract(p.data, '$.text'), 1, 500) as text_preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id IN ('ses_11fb93db9ffeyYusarKBcu2XPb')
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'text'
      AND lower(p.data) LIKE '%v1.%'
    ORDER BY m.time_created DESC
    LIMIT 5
  `);
  if (releaseInfo.length > 0) {
    for (const row of releaseInfo[0].values) {
      const text = row[0].replace(/\n/g, ' ').substring(0, 350);
      console.log(`\n  ${text}`);
    }
  }

  db.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
