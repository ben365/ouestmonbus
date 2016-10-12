#!/bin/bash

cd "$(dirname "$0")"
git pull -r -f
git checkout master

node download.js
for (( c=0; c<=$1; c++ ))
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
