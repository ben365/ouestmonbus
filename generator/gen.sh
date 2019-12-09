#!/bin/bash

cd "$(dirname "$0")"
git pull -r -f
git checkout master

tmp_file=$(mktemp)
curl -u benm365 -s https://data.explore.star.fr/api/records/1.0/search/?dataset=tco-busmetro-horaires-gtfs-versions-td > "$tmp_file"
nb_records=$(cat "$tmp_file" | jq '.records | length') 

nb_days_to_gen=0

for ((i=0; i<nb_records; i++)); do
    last_day_data=$(cat "$tmp_file" | jq .records[$i].fields.finvalidite | sed s/\"//g)
    nb_days=$(( ($(date --date="$last_day_data" +%s) - $(date +%s) )/(60*60*24) ))
    if [ "$nb_days" -gt "$nb_days_to_gen" ]
    then
        nb_days_to_gen=$nb_days
    fi
done

echo "Generate data for $nb_days_to_gen days"

node download.js
for (( c=0; c<=$nb_days_to_gen; c++ ))
do
    node generate.js $c
done

node newgetpdfurl.js

git add ../data/img_url.json
git add ../data/today/
git commit --no-verify -m "auto add data"
git push
git checkout gh-pages
git merge master -m "merge into master"
git push
