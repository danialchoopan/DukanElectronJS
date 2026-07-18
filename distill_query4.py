import sqlite3
import json
import time
from collections import Counter

DB_PATH = r'C:\Users\daniru\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

thirty_days_ago_ms = int((time.time() - 30*24*3600) * 1000)

# Broapp sessions
broapp_sessions = [
    'ses_11fb93db9ffeyYusarKBcu2XPb',
    'ses_0a844db31ffehVZJ74On3CmtLW', 
    'ses_0cd4fe99effeYEsVlvxwPpA6Ab',
    'ses_10120286fffegZ2gjprzfXmJ1r',
    'ses_13ddffd36ffe1KolEgUeurtzzi',
    'ses_11fb949d7ffeYkCKOCJXYt2Zj5',
    'ses_11fb95267ffeGQ3Et42AhS4cA3',
]

# 1. Look at repeated tool call patterns (sequences of 3+ tools in order)
print("=== TOOL CALL SEQUENCES PER SESSION ===")
for sid in broapp_sessions[:3]:  # Just the biggest sessions
    cur.execute("""
        SELECT json_extract(p.data, '$.tool') as tool,
               json_extract(p.data, '$.state.input') as input_data,
               m.session_id
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ?
          AND json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
        ORDER BY p.time_created ASC
    """, (sid,))
    rows = cur.fetchall()
    
    # Count bash commands
    bash_cmds = Counter()
    for r in rows:
        tool = r['tool']
        if tool == 'bash' and r['input_data']:
            try:
                inp = json.loads(r['input_data'])
                cmd = inp.get('command', '')[:80]
                bash_cmds[cmd] += 1
            except:
                pass
    
    print(f"\n--- Session {sid} ---")
    print(f"  Total tool calls: {len(rows)}")
    print(f"  Top bash commands:")
    for cmd, count in bash_cmds.most_common(15):
        print(f"    [{count}x] {cmd}")

# 2. Look at task patterns
print("\n=== TASKS IN BROAPP SESSIONS ===")
placeholders = ','.join(['?'] * len(broapp_sessions))
cur.execute(f"""
    SELECT session_id, status, summary, created_at
    FROM task
    WHERE session_id IN ({placeholders})
    ORDER BY created_at DESC
    LIMIT 50
""", broapp_sessions)
tasks = cur.fetchall()
for t in tasks:
    from datetime import datetime
    tc = datetime.fromtimestamp(t['created_at']/1000).strftime('%Y-%m-%d %H:%M') if t['created_at'] else '?'
    print(f"  [{t['session_id'][:20]}] {t['status']} {tc} {t['summary']!r}")

# 3. Look at repeated file patterns - which files are edited most
print("\n=== MOST-EDITED FILES IN BROAPP SESSIONS ===")
cur.execute(f"""
    SELECT json_extract(p.data, '$.state.input') as input_data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id IN ({placeholders})
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.tool') = 'edit'
      AND p.time_created > ?
""", broapp_sessions + [thirty_days_ago_ms])
edit_rows = cur.fetchall()

file_counter = Counter()
for r in edit_rows:
    if r['input_data']:
        try:
            inp = json.loads(r['input_data'])
            fp = inp.get('file_path', '')
            if fp:
                # Normalize to relative
                fp = fp.replace('C:\\Users\\daniru\\Desktop\\broapp\\', '')
                fp = fp.replace('C:\\Users\\daniru\\Desktop\\broapp/', '')
                file_counter[fp] += 1
        except:
            pass

print(f"  Total edit operations: {len(edit_rows)}")
for fp, count in file_counter.most_common(20):
    print(f"  [{count}x] {fp}")

# 4. Look at grep patterns - what is searched for repeatedly
print("\n=== MOST-SEARCHED PATTERNS ===")
cur.execute(f"""
    SELECT json_extract(p.data, '$.state.input') as input_data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id IN ({placeholders})
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.tool') = 'grep'
      AND p.time_created > ?
""", broapp_sessions + [thirty_days_ago_ms])
grep_rows = cur.fetchall()

grep_counter = Counter()
for r in grep_rows:
    if r['input_data']:
        try:
            inp = json.loads(r['input_data'])
            pat = inp.get('pattern', '')[:60]
            if pat:
                grep_counter[pat] += 1
        except:
            pass

for pat, count in grep_counter.most_common(20):
    print(f"  [{count}x] {pat}")

# 5. Read patterns
print("\n=== MOST-READ FILES ===")
cur.execute(f"""
    SELECT json_extract(p.data, '$.state.input') as input_data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id IN ({placeholders})
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.tool') = 'read'
      AND p.time_created > ?
""", broapp_sessions + [thirty_days_ago_ms])
read_rows = cur.fetchall()

read_counter = Counter()
for r in read_rows:
    if r['input_data']:
        try:
            inp = json.loads(r['input_data'])
            fp = inp.get('file_path', '')
            if fp:
                fp = fp.replace('C:\\Users\\daniru\\Desktop\\broapp\\', '')
                fp = fp.replace('C:\\Users\\daniru\\Desktop\\broapp/', '')
                read_counter[fp] += 1
        except:
            pass

for fp, count in read_counter.most_common(20):
    print(f"  [{count}x] {fp}")

conn.close()
