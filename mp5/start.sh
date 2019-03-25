#! /bin/bash

docker build -t ajaximage .

docker run -d --name ajaxserver -p 3000:3000 ajaximage