#!/bin/sh
cd /home/gitbuffer/datastore/ && git pull
nohup node /home/gitbuffer/datastore/main.js > June-11th-2013.log &
cd /home/gitbuffer/Daemons/ && git pull
nohup node /home/gitbuffer/Daemons/main.js -mysql online -batchsize 50 > June-11th-2013.log &
