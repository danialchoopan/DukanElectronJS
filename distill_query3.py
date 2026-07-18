import sqlite3
import json
import time

DB_PATH = r'C:\Users\daniru\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

thirty_days_ago_ms = int((time.time() - 30*24*3600) * 1000)

# 1. Get REAL user sessions (not checkpoint-writer subagent sessions) for broapp project
# Filter: not checkpoint-writer titles, and directory matches broapp
cur.execute("""
    SELECT id, title, time_created, directory
    FROM session 
    WHERE time_updated > ?
      AND project_id = '5af8ade2-d5cf-4e86-9a11-db5d6f5c878d'
      AND title NOT LIKE 'checkpoint-writer:%'
    ORDER BY time_updated DESC
""", (thirty_days_ago_ms,))
user_sessions = cur.fetchall()
print("=== REAL USER SESSIONS (broapp, last 30 days) ===")
for s in user_sessions:
    from datetime import datetime
    tc = datetime.fromtimestamp(s['time_created']/1000).strftime('%Y-%m-%d %H:%M')
    print(f"  [{s['id']}] {s['title']!r} created={tc}")

# 2. For each real session, get user messages (first 500 chars of each)
print("\n=== USER MESSAGES FROM BROAPP SESSIONS ===")
for s in user_sessions:
    cur.execute("""
        SELECT id, data, time_created
        FROM message
        WHERE session_id = ?
        ORDER BY time_created ASC
    """, (s['id'],))
    messages = cur.fetchall()
    user_msgs = []
    for m in messages:
        try:
            d = json.loads(m['data'])
            if d.get('role') == 'user':
                # Get text parts
                cur.execute("""
                    SELECT data FROM part WHERE message_id = ?
                """, (m['id'],))
                parts = cur.fetchall()
                text = ''
                for p in parts:
                    pd = json.loads(p['data'])
                    if pd.get('type') == 'text':
                        text = pd.get('text', '')[:500]
                        break
                if text:
                    user_msgs.append(text[:300])
        except:
            pass
    if user_msgs:
        print(f"\n--- Session: {s['title']!r} [{s['id']}] ---")
        for i, msg in enumerate(user_msgs[:5]):
            print(f"  User msg {i+1}: {msg[:300]}")
        if len(user_msgs) > 5:
            print(f"  ... ({len(user_msgs)} total user messages)")

# 3. Get tool usage across all broapp sessions
print("\n=== TOOL USAGE IN BROAPP SESSIONS (last 30 days) ===")
session_ids = [s['id'] for s in user_sessions]
if session_ids:
    placeholders = ','.join(['?'] * len(session_ids))
    cur.execute(f"""
        SELECT json_extract(p.data, '$.tool') as tool,
               count(*) as n,
               count(DISTINCT m.session_id) as session_count
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id IN ({placeholders})
          AND json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
        GROUP BY tool
        ORDER BY n DESC
        LIMIT 30
    """, session_ids)
    for row in cur.fetchall():
        print(f"  {row['tool']}: {row['n']} calls across {row['session_count']} sessions")

conn.close()
