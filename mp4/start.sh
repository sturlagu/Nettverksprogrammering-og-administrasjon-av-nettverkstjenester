#! /bin/bash

docker build -t nodejs-restimage .

docker run -d --name restapiserver -p 3000:3000 nodejs-restimage