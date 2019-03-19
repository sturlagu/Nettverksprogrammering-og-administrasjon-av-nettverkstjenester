#!/bin/sh

docker build -t cgi-server-image .

docker run --name cgiserver -p 8081:80 cgi-server-image
