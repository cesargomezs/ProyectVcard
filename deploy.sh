#!/bin/bash
npm run build && npm run deploy

git add .

if [ -z "$1" ]; then
    git commit -m "ci(sh): deploy react + vite app"
else
    git commit -m "$1"
fi

git push -f
