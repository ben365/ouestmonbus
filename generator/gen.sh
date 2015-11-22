#!/bin/bash

cd "$(dirname "$0")"
git pull -r -f

node download.js
for (( c=1; c<=$1; c++ ))
do
    node generate.js $c
done

node newgetpdfurl.js

git add ../data/img_url.json
git add ../data/today/
git commit --no-verify -m "auto add data"
git push
