const port           = 3000;
const express        = require('express');
const js2xmlparser   = require("js2xmlparser"); 
const sqlite3        = require('sqlite3').verbose();
var db               = new sqlite3.Database('bokbase.db');
const md5            = require('md5');
const cookieParser   = require('cookie-parser');
// Generate a v4 (random) id
const uuidv4         = require('uuidv4');
const app            = express();
const xmlparser      = require('express-xml-bodyparser');
var xsdValidator     = require('libxml-xsd');
var http             = require('http');

app.use(cookieParser());
app.use(xmlparser());
app.use('/index.html', express.static(__dirname + '/www/index.html'));
app.use('/stylesheet.css', express.static(__dirname + '/www/stylesheet.css'));

app.listen(port, () => console.log(`RestAPI listening on port ${port}!`));

// LOGIN (sjekk passord mot hash, og sett sesjonID)
app.post('/login', (req, res) => { 
    var data = {
        brukerID: req.body.loginform.brukerid[0],
        passord: req.body.loginform.passord[0]
    }
    
    var SQL = `SELECT brukerID, passordHash FROM bruker WHERE brukerID = ?`;
    db.get(SQL, data.brukerID, (err, row) => {
        // Går gjennom tabell bruker
        if(row != null){
            // Sjekker først brukernavn
            if(data.brukerID == row.brukerID){
                // Hasher passordet
                let passordHash = md5(data.passord);
                // Sjekker hashed password
                if(passordHash == row.passordHash){
                    // Brukeren er nå validert
                    // Lag og sett sesjonID
                    var sesjonID = uuidv4();
                    var SQL = `INSERT INTO sesjon(sesjonID, brukerID) VALUES(?,?);`
                    db.run(SQL, [sesjonID, data.brukerID], (err) => {
                        if(err){
                            console.log("Klarte ikke sette sesjonID");
                        }
                         else{
                            console.log("SessionID: " + sesjonID);
                        }
                    });
                    res.cookie("SesjonID", sesjonID).send("Logged in");
                }
                else{
                    res.send("Feil passord");
                }
            }
            else{
                res.send("Feil brukerID");
            }
        }
        else if(err){
            res.send("Select paramaters went wrong");
        }
        else{
            res.send("DB empty");
        }
    });
});

// LOGOUT (slette sesjonID)
app.delete('/logout', (req, res) =>{
    // Henter ut sesjonID
    var data = {
        sesjonID: req.cookies['SesjonID']
    }
    
    var SQL = 'DELETE FROM sesjon WHERE sesjonID = ?';
    db.run(SQL, data.sesjonID, (err, row) => {
        if(err){
            res.send("select parameters wrong/ or sesjonID gone");
        }
        else{
            res.clearCookie('SesjonID', { path: '/cgi-bin/' }).send();
        }
    });
});

// ******FORFATTER********
// HENTE UT EN POST - FORFATTER
app.get('/forfatter/:forfatterID', (req, res) => {
    // Henter ut forfatterID
    var data = {
        forfatterID: req.params.forfatterID
    }
    var SQL = 'SELECT * FROM forfatter WHERE forfatterID = ?';
    db.all(SQL, data.forfatterID, (err, row) => {
        if(row.length > 0){
            res.setHeader('content-type', 'application/xml');
            // Henter xsd fil fra webtjener
            http.get("http://localhost/respons.xsd").on('response', function (response) {
                var xsd = '';
                response.on('data', function (chunk) {
                    xsd += chunk;
                });
                // Her har vi hele xsd filen
                response.on('end', function () {
                    // Validerer xml data mot xml schema
                    //console.log(xsd)
                    var schema = xsdValidator.parse(xsd);
                    //console.log(js2xmlparser.parse("forfatter", row))
                    var validationErrors = schema.validate(js2xmlparser.parse("forfatter", row))
                    if(validationErrors == null){
                        res.send(js2xmlparser.parse("forfatter", row));
                    }
                    else{
                        res.send("Validation error");  
                    }                   
                });
            });
        }
        else if(err){
            res.send("Something went wrong!");
        }
        else{
            res.send("Couldn't find anything...")
        }
    })
});

// HENTE ALLE POSTER I EN TABELL - FORFATTER
app.get('/forfatter', (req, res) => {
    var SQL = 'SELECT * FROM forfatter';
    db.all(SQL, (err, row) => {
        if(row.length > 0){
            res.setHeader('content-type', 'text/xml');
            // Henter xsd fil fra webtjener
            http.get("http://localhost/respons.xsd").on('response', function (response) {
                var xsd = '';
                response.on('data', function (chunk) {
                    xsd += chunk;
                });
                // Her har vi hele xsd filen
                response.on('end', function () {
                    // Validerer xml data mot xml schema
                    //console.log(xsd)
                    var schema = xsdValidator.parse(xsd);
                    //console.log(js2xmlparser.parse("forfatter", row))
                    var validationErrors = schema.validate(js2xmlparser.parse("forfatter", row))
                    if(validationErrors == null){
                        res.send(js2xmlparser.parse("forfatter", row));
                    }
                    else{
                        res.send("Validation error");  
                    }                   
                });
            });
        }
        else if(err){
            res.send("Something went wrong!");
        }
        else{
            res.send("Couldn't find anything...")
        }
    })
});

// LEGGE TIL EN POST - FORFATTER
app.post('/forfatter', (req, res) => {
    // Data som skal legges til
    var data = {
        forfatterID: req.body.info.forfatterid[0],
        fornavn: req.body.info.fornavn[0],
        etternavn: req.body.info.etternavn[0],
        nasjonalitet: req.body.info.nasjonalitet[0]
    }
    console.log(data);
    // Validerer at brukeren er logget inn
    var sesjonID = req.cookies['SesjonID']
    var SQL = 'SELECT sesjonID FROM sesjon WHERE sesjonID = ?';
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null){
            if(sesjonID == row.sesjonID){
                // Brukeren er nå validert
                // Setter inn data
                var SQL = `INSERT INTO forfatter(forfatterID, fornavn, etternavn, nasjonalitet) VALUES(?,?,?,?);`;
                db.run(SQL, [data.forfatterID, data.fornavn, data.etternavn, data.nasjonalitet], (err) => {
                    if(err){
                        console.log("Something went wrong!");
                    } else {
                        console.log("forfatter lagt til!");
                        res.send("forfatter lagt til!");
                    }
                });
            }
            else{
                console.log("SesjonID er ikke lik!");
                res.send("SesjonID har utløpt");
            }
        } 
        else{
            console.log("ikke logget inn");
            res.send("ikke logget inn");
        }
    });
});

// ENDRE EN POST - FORFATTER
app.put('/forfatter', (req, res) => {
    // Data som skal endres til
    var data = {
        forfatterID: req.body.info.forfatterid[0],
        fornavn: req.body.info.fornavn[0],
        etternavn: req.body.info.etternavn[0],
        nasjonalitet: req.body.info.nasjonalitet[0]
    }
    console.log(data);
    // Validerer at brukeren er logget inn
    var sesjonID = req.cookies['SesjonID']
    var SQL = 'SELECT sesjonID FROM sesjon WHERE sesjonID = ?';
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null){
            if(sesjonID == row.sesjonID){
                // Brukeren er nå validert
                // Setter inn data hvis det er data som skal oppdateres! (settes ut ifra forfatterID)
                if (req.body.info.fornavn[0]) {
                    var SQL = `UPDATE forfatter SET fornavn = ? WHERE forfatterID = ?`;
                    var parametere = [data.fornavn, data.forfatterID];
                    db.run(SQL, parametere, (err) => {
                        if(err) {
                            console.log("Something went wrong!");
                        } else {
                            console.log("fornavn endret!");
                        }
                    });
                }
                else if (req.body.info.etternavn[0]) {
                    var SQL = `UPDATE forfatter SET etternavn = ? WHERE forfatterID = ?`;
                    var parametere = [data.etternavn, data.forfatterID];
                    db.run(SQL, parametere, (err) => {
                        if(err) {
                            console.log("Something went wrong!");
                        } else {
                            console.log("etternavn endret!");
                        }
                    });
                }
                else if (req.body.info.nasjonalitet[0]) {
                    var SQL = `UPDATE forfatter SET nasjonalitet = ? WHERE forfatterID = ?`;
                    var parametere = [data.nasjonalitet, data.forfatterID];
                    db.run(SQL, parametere, (err) => {
                        if(err) {
                            console.log("Something went wrong!");
                        } else {
                            console.log("nasjonalitet endret!");
                        }
                    });
                }
            }
            else{
                console.log("SesjonID er ikke lik!");
                res.send("SesjonID har utløpt");
            }
        } 
        else{
            console.log("ikke logget inn");
            res.send("ikke logget inn");
        }
    });
});

// Slette en post - forfatter
app.delete('/forfatter', (req, res) => {
    var data = {
        forfatterID: req.body.info.forfatterid[0]
    }
    console.log(data);
    sesjonID = req.cookies['SesjonID']
    console.log(sesjonID);
    var SQL = `SELECT sesjonID FROM sesjon WHERE sesjonID = ?`;
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null) {
            if (sesjonID == row.sesjonID) {
                // Brukeren er nå validert
                // Sletter ønsket data
                if (req.body.info.forfatterid[0]) {
    	           var SQL = `DELETE FROM forfatter WHERE forfatterID = ?`;
    	           db.run(SQL, data.forfatterID, (err) => {
        	           if(err) {
            	           res.send("Something went wrong!");
        	           } else {
            	           res.send("forfatter " + data.forfatterID + " slettet");
        	           }
                   });
                } 
            }else {
                console.log("SesjonID er ikke lik!");
                res.send("SesjonID har utløpt");
            }
        } 
        else{
            console.log("ikke logget inn");
            res.send("ikke logget inn");
        }
    }); 
});
// Slette alle poster - forfatter
app.delete('/forfatterall', (req, res) => {
    sesjonID = req.cookies['SesjonID']
    console.log(sesjonID);
    var SQL = `SELECT sesjonID FROM sesjon WHERE sesjonID = ?`;
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null) {
            if (sesjonID == row.sesjonID) {
                // Brukeren er nå validert
                // Sletter all data
                var SQL = `DELETE FROM forfatter`;
                db.run(SQL, (err) => {
                    if(err) {
                        console.log("Something went wrong!");
                    }else{
                        console.log("Tabell forfatter er slettet");
                        res.send("Tabell forfatter er slettet");
                    }
                });
            }else{
                console.log("SesjonID er ikke lik!");
                res.send("SesjonID har utløpt");
            }
        }else{
            console.log("ikke logget inn");
            res.send("ikke logget inn");
        }
    }); 
});

// ****** BOK ********
// HENTE UT EN POST - BOK
app.get('/bok/:bokID', (req, res) => {
    // Henter ut bokID
    var data = {
        bokID: req.params.bokID
    }
    var SQL = 'SELECT * FROM bok WHERE bokID = ?';
    db.all(SQL, data.bokID, (err, row) => {
        if(row.length > 0){
            res.setHeader('content-type', 'text/xml');
            // Henter xsd fil fra webtjener
            http.get("http://localhost/respons.xsd").on('response', function (response) {
                var xsd = '';
                response.on('data', function (chunk) {
                    xsd += chunk;
                });
                // Her har vi hele xsd filen
                response.on('end', function () {
                    // Validerer xml data mot xml schema
                    //console.log(xsd)
                    var schema = xsdValidator.parse(xsd);
                    var validationErrors = schema.validate(js2xmlparser.parse("bok", row))
                    if(validationErrors == null){
                        res.send(js2xmlparser.parse("forfatter", row));
                    }
                    else{
                        res.send("Validation error");  
                    }                   
                });
            });
        }
        else if(err){
            res.send("Something went wrong!");
        }
        else{
            res.send("Couldn't find anything...")
        }
    })
});

// HENTE ALLE POSTER I EN TABELL - BOK
app.get('/bok', (req, res) => {
    var SQL = 'SELECT * FROM bok';
    db.all(SQL, (err, row) => {
        if(row.length > 0){
            res.setHeader('content-type', 'text/xml');
            // Henter xsd fil fra webtjener
            http.get("http://localhost/respons.xsd").on('response', function (response) {
                var xsd = '';
                response.on('data', function (chunk) {
                    xsd += chunk;
                });
                // Her har vi hele xsd filen
                response.on('end', function () {
                    // Validerer xml data mot xml schema
                    //console.log(xsd)
                    var schema = xsdValidator.parse(xsd);
                    var validationErrors = schema.validate(js2xmlparser.parse("bok", row))
                    if(validationErrors == null){
                        res.send(js2xmlparser.parse("forfatter", row));
                    }
                    else{
                        res.send("Validation error");  
                    }                   
                });
            });
        }
        else if(err){
            res.send("Something went wrong!");
        }
        else{
            res.send("Couldn't find anything...")
        }
    })
});

// LEGGE TIL EN POST - BOK
app.post('/bok', (req, res) => {
    // Data som skal legges til
    var data = {
        bokID: req.body.info.bokid[0],
        tittel: req.body.info.tittel[0],
        forfatterID: req.body.info.forfatterid[0]
    }
    console.log(data);
    // Validerer at brukeren er logget inn
    var sesjonID = req.cookies['SesjonID']
    console.log(sesjonID);
    var SQL = 'SELECT sesjonID FROM sesjon WHERE sesjonID = ?';
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null){
            if(sesjonID == row.sesjonID){
                // Brukeren er nå validert
                // Setter inn data
                var SQL = `INSERT INTO bok(bokID, tittel, forfatterID) VALUES(?,?,?);`;
                db.run(SQL, [data.bokID, data.tittel, data.forfatterID], (err) => {
                    if(err){
                        console.log("Something went wrong!");
                    } else {
                        console.log("bok lagt til!");
                        res.send("bok lagt til!");
                    }
                });
            }
            else{
                console.log("SesjonID er ikke lik!");
                res.send("SesjonID har utløpt");
            }
        } 
        else{
            console.log("ikke logget inn");
            res.send("ikke logget inn");
        }
    });
});

// ENDRE EN POST - BOK
app.put('/bok', (req, res) => {
    // Data som skal endres til
    var data = {
        bokID: req.body.info.bokid[0],
        tittel: req.body.info.tittel[0],
        forfatterID: req.body.info.forfatterid[0],
    }
    console.log(data);
    // Validerer at brukeren er logget inn
    var sesjonID = req.cookies['SesjonID']
    var SQL = 'SELECT sesjonID FROM sesjon WHERE sesjonID = ?';
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null){
            if(sesjonID == row.sesjonID){
                // Brukeren er nå validert
                // Setter inn data hvis det er data som skal oppdateres! (settes ut ifra bokID)
                if (req.body.info.tittel[0]) {
                    var SQL = `UPDATE bok SET tittel = ? WHERE bokID = ?`;
                    var parametere = [data.tittel, data.bokID];
                    db.run(SQL, parametere, (err) => {
                        if(err) {
                            console.log("Something went wrong!");
                        } else {
                            console.log("tittel endret!");
                        }
                    });
                }
                else if (req.body.info.forfatterID[0]) {
                    var SQL = `UPDATE bok SET forfatterID = ? WHERE bokID = ?`;
                    var parametere = [data.forfatterID, data.bokID];
                    db.run(SQL, parametere, (err) => {
                        if(err) {
                            console.log("Something went wrong!");
                        } else {
                            console.log("forfatter endret!");
                        }
                    });
                }
            }
            else{
                console.log("SesjonID er ikke lik!");
                res.send("SesjonID har utløpt");
            }
        } 
        else{
            console.log("ikke logget inn");
            res.send("ikke logget inn");
        }
    });
});

// Slette en post eller alle poster - BOK
app.delete('/bok', (req, res) => {
    var data = {
        bokID: req.body.info.bokid[0]
    }
    console.log(data);
    sesjonID = req.cookies['SesjonID']
    console.log(sesjonID)
    var SQL = `SELECT sesjonID FROM sesjon WHERE sesjonID = ?`;
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null) {
            if (sesjonID == row.sesjonID) {
                // Brukeren er nå validert
                // Sletter ønsket data
                if (req.body.info.bokid[0]) {
    	           var SQL = `DELETE FROM bok WHERE bokID = ?`;
    	           db.run(SQL, data.bokID, (err) => {
        	           if(err) {
            	           res.send("Something went wrong!");
        	           } else {
            	           res.send("Bok: " + data.bokID + " slettet");
        	           }
                   });
                } 
            }else {
                console.log("SesjonID er ikke lik!");
                res.send("SesjonID har utløpt");
            }
        } 
        else{
            console.log("ikke logget inn");
            res.send("ikke logget inn");
        }
    }); 
});
// Slette alle poster - BOK
app.delete('/bokall', (req, res) => {
    sesjonID = req.cookies['SesjonID']
    console.log(sesjonID);
    var SQL = `SELECT sesjonID FROM sesjon WHERE sesjonID = ?`;
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null) {
            if (sesjonID == row.sesjonID) {
                // Brukeren er nå validert
                // Sletter all data
                var SQL = `DELETE FROM bok`;
                db.run(SQL, (err) => {
                    if(err) {
                        console.log("Something went wrong!");
                    }else{
                        console.log("Tabell bok er slettet");
                        res.send("Tabell bok er slettet");
                    }
                });
            }else{
                console.log("SesjonID er ikke lik!");
                res.send("SesjonID har utløpt");
            }
        }else{
            console.log("ikke logget inn");
            res.send("ikke logget inn");
        }
    }); 
});
