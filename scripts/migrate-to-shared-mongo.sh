#!/usr/bin/env bash
# One-time move of the event-manager database from this stack's own Mongo container to the
# shared ecosystem-mongo instance (DAN-90). The deploy runs it before `docker compose up`;
# once the old container is gone it does nothing.
#
# Run from /opt/event-manager under `doppler run` (needs MONGO_PASSWORD for the event-manager
# Mongo user, which can write only the event-manager database).
#
# Steps: stop the backend (no writes during the copy), dump the old database to
# backups/pre-dan-90.archive, check the target database is empty, restore, compare document
# counts per collection. On any failure the old backend is started again and the deploy stops,
# so production keeps running on the old container.
set -euo pipefail

PROJECT=event-manager
DB=event-manager

old_mongo=$(docker ps -q --filter "label=com.docker.compose.project=$PROJECT" --filter "label=com.docker.compose.service=mongodb")
if [ -z "$old_mongo" ]; then
  echo "No old Mongo container in the $PROJECT stack; nothing to move."
  exit 0
fi
: "${MONGO_PASSWORD:?MONGO_PASSWORD is not set}"

backend=$(docker ps -q --filter "label=com.docker.compose.project=$PROJECT" --filter "label=com.docker.compose.service=backend")

restore_backend() {
  if [ -n "$backend" ]; then
    echo "Migration failed: starting the old backend again." >&2
    docker start $backend > /dev/null || true
  fi
}
trap restore_backend ERR

# Prints [[collection, count], ...] sorted by name. Indexes and views are not counted.
COUNT_JS="const d = db.getSiblingDB('$DB'); print(JSON.stringify(d.getCollectionNames().sort().map((c) => [c, d.getCollection(c).countDocuments()])))"
export COUNT_JS

# Runs a command in a throwaway mongo:7 container on the shared network. The password stays in
# the environment and is expanded inside the container.
shared() {
  docker run --rm -i --network ecosystem -e MONGO_PASSWORD -e COUNT_JS mongo:7 sh -c "$1"
}
SHARED_URI='mongodb://event-manager:$MONGO_PASSWORD@ecosystem-mongo:27017/?authSource=admin'

old_count_cmd='mongosh --quiet --eval "$COUNT_JS"'
target_counts=$(shared "mongosh --quiet \"$SHARED_URI\" --eval \"\$COUNT_JS\"")
if [ "$target_counts" != "[]" ]; then
  # A previous run copied the data but the deploy stopped before compose removed the old
  # container: same counts means there is nothing left to do.
  if [ "$target_counts" = "$(docker exec -e COUNT_JS "$old_mongo" sh -c "$old_count_cmd")" ]; then
    echo "$DB is already on ecosystem-mongo with the same document counts; nothing to move."
    trap - ERR
    exit 0
  fi
  echo "The $DB database on ecosystem-mongo is not empty ($target_counts); not overwriting it." >&2
  false
fi

if [ -n "$backend" ]; then
  echo "Stopping the backend so nothing writes during the copy..."
  docker stop $backend > /dev/null
fi

mkdir -p backups
echo "Dumping $DB from the old container to backups/pre-dan-90.archive..."
docker exec "$old_mongo" mongodump --quiet --db="$DB" --archive > backups/pre-dan-90.archive
old_counts=$(docker exec -e COUNT_JS "$old_mongo" sh -c "$old_count_cmd")
echo "Old database: $old_counts"

echo "Restoring into ecosystem-mongo..."
shared "mongorestore --quiet --uri \"$SHARED_URI\" --archive --nsInclude '$DB.*'" < backups/pre-dan-90.archive

new_counts=$(shared "mongosh --quiet \"$SHARED_URI\" --eval \"\$COUNT_JS\"")
echo "New database: $new_counts"
if [ "$old_counts" != "$new_counts" ]; then
  echo "Document counts differ after the restore." >&2
  false
fi

trap - ERR
echo "Moved $DB to ecosystem-mongo. The old container is removed by the next compose up; its volume is kept until it is deleted by hand."
