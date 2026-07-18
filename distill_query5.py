import sqlite3
import json
import time
from collections import Counter

DB_PATH = r'C:\Users\daniru\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# 1. Feature development pattern: look at what tools are called in sequence for tasks
# The main session had 40+ features built. Let's trace one feature's tool sequence.
main_session = 'ses_11fb93db9ffeyYusarKBcu2XPb'

# Get all tasks and their events
cur.execute("""
    SELECT id, summary, status, created_at
    FROM task
    WHERE session_id = ? AND parent_task_id IS NULL
    ORDER BY created_at ASC
""", (main_session,))
tasks = cur.fetchall()
print(f"=== TASKS IN MAIN SESSION ({len(tasks)}) ===")
for t in tasks:
    print(f"  {t['id']}: {t['summary']}")

# For a couple of tasks, trace the tool sequence
print("\n=== TOOL SEQUENCE FOR SAMPLE TASKS ===")
for task in tasks[:3]:
    cur.execute("""
        SELECT kind, summary, at
        FROM task_event
        WHERE task_id = ?
        ORDER BY at ASC
    """, (task['id'],))
    events = cur.fetchall()
    print(f"\n--- Task: {task['summary']} ---")
    for e in events[:10]:
        from datetime import datetime
        ts = datetime.fromtimestamp(e['at']/1000).strftime('%H:%M') if e['at'] else '?'
        print(f"  {ts} [{e['kind']}] {e['summary']!r}" if e['summary'] else f"  {ts} [{e['kind']}]")

# 2. Check if there's a repeated "build → fix → build" pattern
print("\n=== BUILD-FIX-BUILD SEQUENCES ===")
# Get all bash commands from the main session in order
cur.execute("""
    SELECT json_extract(p.data, '$.state.input') as input_data,
           p.time_created
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.tool') = 'bash'
    ORDER BY p.time_created ASC
""", (main_session,))
bash_rows = cur.fetchall()

# Classify commands
build_pattern = []
for r in bash_rows:
    if r['input_data']:
        try:
            inp = json.loads(r['input_data'])
            cmd = inp.get('command', '')
        except:
            cmd = ''
        
        if 'tsc' in cmd and 'vite' in cmd:
            build_pattern.append('BUILD+TSC')
        elif 'tsc' in cmd:
            build_pattern.append('TSC')
        elif 'vite build' in cmd:
            build_pattern.append('VITE_BUILD')
        elif 'verify.js' in cmd:
            build_pattern.append('VERIFY')
        elif 'Remove-Item' in cmd or 'rm ' in cmd:
            build_pattern.append('DB_RESET')
        elif 'git push' in cmd:
            build_pattern.append('GIT_PUSH')
        elif 'git pull' in cmd:
            build_pattern.append('GIT_PULL')
        elif 'vitest' in cmd:
            build_pattern.append('TEST')
        else:
            build_pattern.append('OTHER')

# Count consecutive patterns
print(f"  Total bash commands classified: {len(build_pattern)}")
seq_counter = Counter()
for i in range(len(build_pattern) - 2):
    seq = ' → '.join(build_pattern[i:i+3])
    seq_counter[seq] += 1

print(f"\n  Most common 3-step sequences:")
for seq, count in seq_counter.most_common(10):
    print(f"    [{count}x] {seq}")

# Count overall pattern frequencies
pattern_freq = Counter(build_pattern)
print(f"\n  Overall command frequencies:")
for pat, count in pattern_freq.most_common():
    print(f"    [{count}x] {pat}")

# 3. Look at the "complete feature" pattern - how features are typically structured
print("\n=== COMMON ASSISTANT PATTERNS (read→edit→build sequences) ===")
# Get all tool calls in order
cur.execute("""
    SELECT json_extract(p.data, '$.tool') as tool,
           json_extract(p.data, '$.state.input') as input_data,
           p.time_created
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
    ORDER BY p.time_created ASC
""", (main_session,))
all_tools = cur.fetchall()

# Find repeated tool sequences of 5
tool_seq_counter = Counter()
for i in range(len(all_tools) - 4):
    seq = tuple(t['tool'] for t in all_tools[i:i+5])
    tool_seq_counter[seq] += 1

print(f"  Most common 5-tool sequences:")
for seq, count in tool_seq_counter.most_common(10):
    print(f"    [{count}x] {' → '.join(seq)}")

conn.close()
