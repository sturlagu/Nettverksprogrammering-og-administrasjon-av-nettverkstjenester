#!/bin/bash

# LOGIN
curl -X POST -H 'Content-type: text/xml' -d '<loginform brukerID="1" passord="passord"/>' http://localhost:3000/login


# GET forfatter by ID
#curl -X GET -H 'Content-type: text/xml' http://localhost:3000/forfatter/1

# GET ALL forfatter
#curl -X GET -H 'Content-type: text/xml' http://localhost:3000/forfatter

# POST legg til i forfatter
#curl -X POST -H 'Content-type: text/xml' -d '<forfatterID>2</forfatterID><fornavn>test</fornavn><etternavn>123</etternavn><nasjonalitet>Tysk</nasjonalitet>' http://localhost:3000/forfatter