FROM scratch

VOLUME /var/

COPY error.log /var/log/error.log
COPY index.asis /var/www/index.asis
COPY dumb-init /
COPY webtjener /

EXPOSE 80
CMD ["/dumb-init", "/webtjener"]
