#! /bin/bash

docker build -t nodejs-restimage .

docker run -e VERSION=1.1 --name restapiserver -p 3000:3000 nodejs-restimage