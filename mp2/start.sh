#!/bin/bash

# Compile "webtjener" with static, static includes files needed for the program to run
gcc -o webtjener webtjener.c -static

# Build docker image named "webtjenerexpandedserver" from current directory 
docker build -t webtjenerexpandedserver .

# Run docker image with commands...
# Removing all Linux capabilities from container
# Adding capabilities:
# - bind to privileged ports (below 1024)
# - A process with this capability can change its UID to any other UID
# - A process with this capability can change its GID to any other GID.
# - This capability allows use of chroot()
# CPUs in which to allow execution (Core 0) - cgroups
# Tune container pids limit (set -1 for unlimited) 
# Bind port 80 (host) to 8080 (docker)
# Name runtime image to "server"

docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE --cap-add=SETUID \
	   --cap-add=SETGID --cap-add=SYS_CHROOT \
	   --cpuset-cpus 0 --pids-limit 200 \
	   -p 80:80/tcp --name dockerserverexpanded webtjenerexpandedserver &
