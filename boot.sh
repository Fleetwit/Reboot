#!/bin/sh
killall node
cd /home/gitbuffer/datastore/ && git pull
node /home/gitbuffer/datastore/main.js
cd /home/gitbuffer/Agora/ && git pull
node /home/gitbuffer/Agora/main.js
cd /home/gitbuffer/Daemons/ && git pull
node /home/gitbuffer/Daemons/main.js
cd /home/gitbuffer/Mailstack/ && git pull
node /home/gitbuffer/Mailstack/main.js
