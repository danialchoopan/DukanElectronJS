import sqlite3
import json
import sys
import os

DB_PATH = r'C:\Users\daniru\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# List tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("=== TABLES ===")
print(tables)

# Get schema for key tables
for t in tables[:15]:
    cur.execute(f"PRAGMA table_info({t})")
    cols = [(r[1], r[2]) for r in cur.fetchall()]
    print(f"\n=== {t} columns ===")
    print(cols)

conn.close()
