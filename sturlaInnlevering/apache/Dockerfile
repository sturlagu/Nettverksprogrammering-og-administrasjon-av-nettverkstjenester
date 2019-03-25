# Dockerfile for mp3

FROM httpd:alpine

COPY cgi/* /usr/local/apache2/cgi-bin/
COPY httpd.conf /usr/local/apache2/conf/httpd.conf

EXPOSE 80
