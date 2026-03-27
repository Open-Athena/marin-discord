#!/usr/bin/env bash
# Import archive.db into D1 (local or remote).
#
# Usage:
#   ./d1-import.sh [path/to/archive.db]           # local import (default)
#   ./d1-import.sh --remote [path/to/archive.db]   # remote D1 import
set -euo pipefail

REMOTE=""
DB_PATH="../archive.db"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --remote) REMOTE="--remote"; shift ;;
        *) DB_PATH="$1"; shift ;;
    esac
done

SQL_FILE="../archive.sql"

echo "Dumping $DB_PATH to $SQL_FILE..."
# Dump and convert unistr() calls to plain strings (D1 doesn't support unistr)
sqlite3 "$DB_PATH" .dump | python3 -c "
import sys, re
for line in sys.stdin:
    # Convert unistr('...\\u000a...') to '...\n...' (replace unicode escapes with actual chars)
    def replace_unistr(m):
        s = m.group(1)
        # Replace \\uXXXX with actual characters, except handle them as literal chars in SQL
        s = re.sub(r'\\\\u([0-9a-fA-F]{4})', lambda um: chr(int(um.group(1), 16)), s)
        return \"'\" + s + \"'\"
    line = re.sub(r\"unistr\('((?:[^']|'')*?)'\)\", replace_unistr, line)
    # Skip D1-incompatible statements
    stripped = line.strip().upper()
    if stripped.startswith('PRAGMA'):
        continue
    if stripped in ('BEGIN TRANSACTION;', 'COMMIT;', 'BEGIN;'):
        continue
    # Skip multi-line CREATE TRIGGER (ends with 'END;')
    if stripped.startswith('CREATE TRIGGER'):
        while not line.strip().upper().endswith('END;'):
            line = next(sys.stdin, '')
        continue
    # Skip multi-line CREATE VIRTUAL TABLE (ends with ');')
    if stripped.startswith('CREATE VIRTUAL TABLE'):
        while not line.strip().endswith(');'):
            line = next(sys.stdin, '')
        continue
    # Skip any FTS-related, sqlite_master, or sqlite_sequence statements
    if 'MESSAGES_FTS' in stripped or 'SQLITE_MASTER' in stripped or 'SQLITE_SEQUENCE' in stripped:
        # Skip until we hit a line ending with ';'
        while not line.rstrip().endswith(';'):
            line = next(sys.stdin, '')
        continue
    sys.stdout.write(line)
" > "$SQL_FILE"

# D1 has a ~10MB limit per execute; chunk if needed
FILE_SIZE=$(wc -c < "$SQL_FILE" | tr -d ' ')
echo "SQL dump: $FILE_SIZE bytes"

if [ "$FILE_SIZE" -gt 9000000 ]; then
    echo "File too large for single import, chunking..."
    CHUNK_DIR="../tmp/d1-chunks"
    rm -rf "$CHUNK_DIR"
    mkdir -p "$CHUNK_DIR"
    split -l 200000 "$SQL_FILE" "$CHUNK_DIR/chunk_"

    for chunk in "$CHUNK_DIR"/chunk_*; do
        echo "Importing $(wc -l < "$chunk" | tr -d ' ') lines from $(basename "$chunk")..."
        npx wrangler d1 execute marin-discord $REMOTE --file="$chunk" --yes
    done
    echo "All chunks imported."
else
    echo "Importing..."
    npx wrangler d1 execute marin-discord $REMOTE --file="$SQL_FILE" --yes
fi

# Write metadata
HASH=$(md5 -q "$DB_PATH" 2>/dev/null || md5sum "$DB_PATH" | cut -d' ' -f1)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
npx wrangler d1 execute marin-discord $REMOTE \
    --command="CREATE TABLE IF NOT EXISTS _metadata (key TEXT PRIMARY KEY, value TEXT); INSERT OR REPLACE INTO _metadata VALUES ('md5', '$HASH'), ('imported_at', '$TIMESTAMP');" \
    --yes

echo "Done. MD5: $HASH, imported at: $TIMESTAMP"
