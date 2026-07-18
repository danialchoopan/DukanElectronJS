import sqlite3
import json

DB_PATH = r'C:\Users\daniru\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# 1. Find current project
cur.execute("SELECT id, name, worktree FROM project WHERE worktree LIKE '%broapp%'")
projects = cur.fetchall()
print("=== PROJECTS (broapp) ===")
for p in projects:
    print(f"  ID={p[0]}, name={p[1]}, worktree={p[2]}")

if not projects:
    print("  No project found for broapp, listing all:")
    cur.execute("SELECT id, name, worktree FROM project ORDER BY time_created DESC LIMIT 10")
    for p in cur.fetchall():
        print(f"  ID={p[0]}, name={p[1]}, worktree={p[2]}")

# 2. Get all sessions (last 30 days) - use time_updated as proxy for recent activity
# 30 days ago in milliseconds
import time
thirty_days_ago_ms = int((time.time() - 30*24*3600) * 1000)
sixty_days_ago_ms = int((time.time() - 60*24*3600) * 1000)

print(f"\n=== RECENT SESSIONS (last 30 days, cutoff={thirty_days_ago_ms}) ===")
cur.execute("""
    SELECT id, title, time_created, time_updated, directory, project_id
    FROM session 
    WHERE time_updated > ?
    ORDER BY time_updated DESC
    LIMIT 30
""", (thirty_days_ago_ms,))
sessions = cur.fetchall()
for s in sessions:
    from datetime import datetime
    tc = datetime.fromtimestamp(s[2]/1000).strftime('%Y-%m-%d %H:%M') if s[2] else '?'
    tu = datetime.fromtimestamp(s[3]/1000).strftime('%Y-%m-%d %H:%M') if s[3] else '?'
    print(f"  [{s[0]}] {s[1]!r} created={tc} updated={tu} dir={s[4]!r} proj={s[5]}")

# 3. Also look at sessions in 30-60 day window
print(f"\n=== OLDER SESSIONS (30-60 days ago) ===")
cur.execute("""
    SELECT id, title, time_created, time_updated, directory, project_id
    FROM session 
    WHERE time_updated > ? AND time_updated <= ?
    ORDER BY time_updated DESC
    LIMIT 20
""", (sixty_days_ago_ms, thirty_days_ago_ms))
older = cur.fetchall()
for s in older:
    tc = datetime.fromtimestamp(s[2]/1000).strftime('%Y-%m-%d %H:%M') if s[2] else '?'
    tu = datetime.fromtimestamp(s[3]/1000).strftime('%Y-%m-%d %H:%M') if s[3] else '?'
    print(f"  [{s[0]}] {s[1]!r} created={tc} updated={tu} dir={s[4]!r} proj={s[5]}")

conn.close()
