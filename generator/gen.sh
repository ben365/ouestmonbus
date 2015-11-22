#!/bin/bash

cd "$(dirname "$0")"
git pull -r -f

node download.js
node generate.js 1
node newgetpdfurl.js

git add ../data/img_url.json
git add ../data/today/
git commit --no-verify -m "auto add data"
git push
