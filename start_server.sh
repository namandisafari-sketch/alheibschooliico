#!/bin/bash
export NODE_ENV=production
export PORT=3000
cd /home/iico/alheibschooliico
exec node dist/server.cjs >> server.log 2>&1
