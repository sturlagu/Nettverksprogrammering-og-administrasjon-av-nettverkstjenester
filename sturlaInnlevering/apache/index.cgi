#!/bin/bash
# Henter ut variabler av en POST request
# Alt er POST request utenom første gangen man henter siden (GET)
if [ "$REQUEST_METHOD" = "POST" ] ; then
  if [ "$CONTENT_LENGTH" -gt 0 ] ; then
    # Leser req-body in i variabel POST_BODY
      read -n $CONTENT_LENGTH POST_BODY <&0
  fi
fi

# ACTION TYPE kommer fra bodyen. Blir satt i html-form request=ACTION TYPE
ACTION_TYPE=$(echo $POST_BODY | awk -F "request=" '{print $2}')
#LOGIN
if [ "$ACTION_TYPE" = "LOGIN" ] ; then 
  USER_ID=$(echo $POST_BODY | awk -F'[=&]' {'print $2'})
  PASSWORD=$(echo $POST_BODY | awk -F'[=&]' {'print $4'})
  
  XML_CONTENT="<loginform><brukerid>$USER_ID</brukerid><passord>$PASSWORD</passord></loginform>"
  RESPONSE=$(curl -i --request POST --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/login" --header 'content-type: text/xml' --data "$XML_CONTENT" | grep Cookie)
  #RESP=$(curl -i --request POST --url "http://172.17.0.2:3000/login" --header 'content-type: text/xml' --data "$XML_CONTENT")
  
  COOKIE=$(echo "$RESPONSE" | awk -F'[:;]' {'print $2'})
  
  #HTML-Header
  echo "Set-cookie:$COOKIE"        
fi
# LOGOUT
if [ "$ACTION_TYPE" = "LOGOUT" ] ; then
  curl --request DELETE --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/logout"
fi
# Resten av HTML-HEADER
echo "Content-type:text/html;charset=utf-8"
echo 

#HTML-BODY
cat << EOF
<!doctype html>
<html>
<head>
<title>CGI: Form</title>
<style>
  form {
        border: 3px solid #f1f1f1;
    }
    h1 {
        color: #4f92ff;
    }
    h4 {
        color: #4f92ff;
    }
    button {
      background-color: #4f92ff;
      color: white;
      padding: 15px 32px;
      text-align: center;
      display: inline-block;
      font-size: 16px;
      margin: 8px 0;
      cursor: pointer;
    }
    input {
      background-color: #e8f0ff;
    }
    #forms {
      display: block;
    }
    #form1 {
      float: left;
      width: 50%;
    }
    #form2 {
      float: left;
      width: 50%;
    }
  </style>
</head>
<body>
  <h1>Biblioteket</h1>
<form method=POST>
  <div class="container">
    <input type="text" placeholder="brukerid" name="uname">
    <input type="password" placeholder="passord" name="psw">
    <button type="submit" name="request" value="LOGIN">Login</button>
    <button type="submit" name="request" value="LOGOUT">Logout</button>
  </div>
</form>

  <div id="form2">
    <form method=POST>
      <h4>LEGG TIL / REDIGER / SLETT / SØK</h4>
        <select name=table>
          <option value="forfatter">Forfatter</option>
          <option value="bok">Bok</option>
        </select><br><br>
      <input type="text" placeholder="Forfatter ID / Bok ID" name="id"><br>
      <input type="text" placeholder="Fornavn / Tittel" name="param1"><br>
      <input type="text" placeholder="Etternavn / Forfatter ID" name="param2"><br>
      <input type="text" placeholder="Nasjonalitet" name="param3"><br><br>
      <input type="radio" name="request" value="GET"> SØK<br>
      <input type="radio" name="request" value="POST"> Legg til<br>
      <input type="radio" name="request" value="PUT"> Rediger<br>
      <input type="radio" name="request" value="DELETE"> Slett<br><br>
      <input type="radio" name="request" value="DELETEALL"> Slett alt<br><br>
      <button type="submit">SEND</button>
    </form>
  </div>
</div>
</body>
</html>
EOF

TABLE=$(echo $POST_BODY | awk -F'[=&]' {'print $2'})
ID=$(echo $POST_BODY | awk -F'[=&]' {'print $4'})
PARAM1=$(echo $POST_BODY | awk -F'[=&]' {'print $6'})
PARAM2=$(echo $POST_BODY | awk -F'[=&]' {'print $8'})
PARAM3=$(echo $POST_BODY | awk -F'[=&]' {'print $10'})

if [ "$ACTION_TYPE" = "GET" ] ; then
  resp=$(curl --request GET "http://172.17.0.2:3000/$TABLE/$ID")  
fi

if [ "$ACTION_TYPE" = "POST" ] ; then
  if [ "$TABLE" = "forfatter" ] ; then
    XML_CONTENT="<info><forfatterid>$ID</forfatterid><fornavn>$PARAM1</fornavn><etternavn>$PARAM2</etternavn><nasjonalitet>$PARAM3</nasjonalitet></info>"
    resp=$(curl --request POST --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/forfatter" --header 'cache-control: no-cache' --header 'content-type: text/xml' --data "$XML_CONTENT")
  elif [ "$TABLE" = "bok" ] ; then
    XML_CONTENT="<info><bokid>$ID</bokid><tittel>$PARAM1</tittel><forfatterid>$PARAM2</forfatterid></info>"
    resp=$(curl --request POST --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/bok" --header 'cache-control: no-cache' --header 'content-type: text/xml' --data "$XML_CONTENT")
  fi
fi

if [ "$ACTION_TYPE" = "PUT" ] ; then
  if [ "$TABLE" = "forfatter" ] ; then
    XML_CONTENT="<info><forfatterid>$ID</forfatterid><fornavn>$PARAM1</fornavn><etternavn>$PARAM2</etternavn><nasjonalitet>$PARAM3</nasjonalitet></info>"
    resp=$(curl --request PUT --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/forfatter" --header 'cache-control: no-cache' --header 'content-type: text/xml' --data "$XML_CONTENT")
  elif [ "$TABLE" = "bok" ] ; then
    XML_CONTENT="<info><bokid>$ID</bokid><tittel>$PARAM1</tittel><forfatterid>$PARAM2</forfatterid></info>"
    resp=$(curl --request PUT --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/bok" --header 'cache-control: no-cache' --header 'content-type: text/xml' --data "$XML_CONTENT")
  fi
fi


if [ "$ACTION_TYPE" = "DELETE" ] ; then
  if [ "$TABLE" = "forfatter" ] ; then
    XML_CONTENT="<info><forfatterid>$ID</forfatterid></info>"
    resp=$(curl --request DELETE --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/forfatter" --header 'cache-control: no-cache' --header 'content-type: text/xml' --data "$XML_CONTENT")
  elif [ "$TABLE" = "bok" ] ; then
    XML_CONTENT="<info><bokid>$ID</bokid></info>"
    resp=$(curl --request DELETE --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/bok" --header 'cache-control: no-cache' --header 'content-type: text/xml' --data "$XML_CONTENT")
  fi
fi

if [ "$ACTION_TYPE" = "DELETEALL" ] ; then
  if [ "$TABLE" = "forfatter" ] ; then
    resp=$(curl --request DELETE --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/forfatterall" --header 'cache-control: no-cache' --header 'content-type: text/xml' --data "$XML_CONTENT")
  elif [ "$TABLE" = "bok" ] ; then
    XML_CONTENT="<info><bokid>$ID</bokid></info>"
    resp=$(curl --request DELETE --cookie "$HTTP_COOKIE" --url "http://172.17.0.2:3000/bokall" --header 'cache-control: no-cache' --header 'content-type: text/xml' --data "$XML_CONTENT")
  fi
fi

echo '<br>'
echo $resp
echo '<br>'