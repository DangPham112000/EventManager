#!/usr/bin/env bash
# Dump the event-manager database from the shared ecosystem-mongo to backups/<name>.archive,
# once: does nothing when that file already exists. The deploy runs it before starting a
# backend that migrates data, so the data from before the migration can be restored.
#
# Run from /opt/event-manager under `doppler run` (needs MONGO_PASSWORD).
# Restore: docker run --rm -i --network ecosystem -e MONGO_PASSWORD mongo:7 sh -c \
#   'mongorestore --uri "mongodb://event-manager:$MONGO_PASSWORD@ecosystem-mongo:27017/?authSource=admin" --archive --drop' \
#   < backups/<name>.archive
set -euo pipefail

name=${1:?usage: backup-db.sh <name>}
file="backups/$name.archive"
if [ -f "$file" ]; then
  echo "$file already exists; no new backup."
  exit 0
fi
: "${MONGO_PASSWORD:?MONGO_PASSWORD is not set}"

mkdir -p backups
echo "Dumping event-manager to $file..."
# Single quotes: $MONGO_PASSWORD is expanded inside the container, not in this command line.
docker run --rm -i --network ecosystem -e MONGO_PASSWORD mongo:7 sh -c \
  'mongodump --quiet --uri "mongodb://event-manager:$MONGO_PASSWORD@ecosystem-mongo:27017/event-manager?authSource=admin" --archive' \
  > "$file.tmp"
mv "$file.tmp" "$file"
echo "Backup written: $file ($(wc -c < "$file") bytes)"
