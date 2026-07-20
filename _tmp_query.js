const initSqlJs = require('sql.js/dist/sql-asm.js');
const fs = require('fs');

const DB_PATH = 'C:\\Users\\daniru\\.local\\share\\mimocode\\mimocode.db';

async function main() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buf);

  // Find the project ID for this workspace
  const projects = db.exec("SELECT id, worktree, name FROM project");
  console.log("=== ALL PROJECTS ===");
  if (projects.length > 0) {
    for (const row of projects[0].values) {
      console.log(`  id=${row[0]}  worktree=${row[1]}  name=${row[2]}`);
    }
  }

  // Find sessions for this project (broapp)
  const broappProj = db.exec("SELECT id FROM project WHERE worktree LIKE '%broapp%'");
  let projId = '';
  if (broappProj.length > 0 && broappProj[0].values.length > 0) {
    projId = broappProj[0].values[0][0];
  }
  console.log("\n=== PROJECT ID for broapp:", projId);

  // List all sessions for this project, newest first
  const sessions = db.exec(`SELECT id, title, time_created, time_updated FROM session WHERE project_id='${projId}' ORDER BY time_created DESC LIMIT 20`);
  console.log("\n=== RECENT SESSIONS (last 20) ===");
  if (sessions.length > 0) {
    for (const row of sessions[0].values) {
      const created = new Date(row[2] * 1000).toISOString();
      const updated = new Date(row[3] * 1000).toISOString();
      console.log(`  ${row[0]} | ${created} → ${updated} | ${row[1]}`);
    }
  }

  db.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
