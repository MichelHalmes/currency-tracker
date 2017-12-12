#! /bin/bash

# This will be launched by corn-job: crontab -e

echo "Launching currency_tracker!"

source source.env

export PATH=/home/pi/.nvm/versions/node/v7.10.0/bin:$PATH

babel-node --presets node6 _main.js

exit 0
