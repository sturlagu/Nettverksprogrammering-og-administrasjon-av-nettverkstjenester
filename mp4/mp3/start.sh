#!/bin/sh

docker build -t cgi-server2-image .

docker run --name cgiserver2 -p 80:80 cgi-server2-image
