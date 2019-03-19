# Dockerfile for mp2
FROM scratch

VOLUME /var/

COPY error.log /var/log/webtjener/error.log
COPY www/* /var/www/
COPY dumb-init /
COPY webtjener /

EXPOSE 80
CMD ["/dumb-init", "/webtjener"]
