# Dockerfile for mp3

FROM httpd:alpine

# Vi trenger curl for denne cgi-serveren
RUN apk update
RUN apk add curl

COPY cgi/* /usr/local/apache2/cgi-bin/
COPY httpd.conf /usr/local/apache2/conf/httpd.conf

EXPOSE 80
