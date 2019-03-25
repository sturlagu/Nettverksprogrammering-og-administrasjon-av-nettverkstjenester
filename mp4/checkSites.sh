#!/bin/bash


# LOGIN (Ved login må man ta vare på cookie her lokalt så vi kan utføre post, put eller delete handlinger)
curl -X POST -H 'Content-type: text/xml' -d '<loginform><brukerid>1</brukerid><passord>passord</passord></loginform>' http://localhost:3000/login


# GET forfatter by ID
#curl -X GET -H 'Content-type: text/xml' http://localhost:3000/forfatter/1

# GET ALL forfatter
#curl -X GET -H 'Content-type: text/xml' http://localhost:3000/forfatter



# POST legg til i forfatter
#curl -X POST -H 'Content-type: text/xml' -d '<info><forfatterID>5</forfatterID><fornavn>Magnus</fornavn><etternavn>Svenn</etternavn><nasjonalitet>Fransk</nasjonalitet></info>' http://localhost:3000/forfatter