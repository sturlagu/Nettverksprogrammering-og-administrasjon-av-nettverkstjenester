FROM node:8.6-alpine
 
RUN mkdir -p /restAPI
WORKDIR /restAPI

RUN npm install
RUN npm install sqlite3 express js2xmlparser body-parser cookie-parser md5 express-xml-bodyparser uuidv4

COPY www/* ./www/
COPY package.json ./
COPY app.js bokbase.db ./

EXPOSE 3000
CMD ["node", "app.js"]

