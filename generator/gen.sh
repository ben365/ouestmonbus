#!/bin/bash

cd "$(dirname "$0")"
git pull -r -f
git checkout master

last_day_data=$(curl -u benm365 -s https://data.explore.star.fr/api/records/1.0/search/?dataset=tco-busmetro-horaires-gtfs-versions-td | jq .records[0].fields.finvalidite | sed s/\"//g)
nb_days=$(( ($(date --date="$last_day_data" +%s) - $(date +%s) )/(60*60*24) ))

echo "Generate data for $nb_days days"

node download.js
for (( c=0; c<=$nb_days; c++ ))
do
    node generate.js $c
done

node newgetpdfurl.js

git add ../data/img_url.json
git add ../data/today/
git commit --no-verify -m "auto add data"
git push
git checkout gh-pages
git merge master
git push
