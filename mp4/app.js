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


app.use(cookieParser());
app.use(xmlparser());
app.listen(port, () => console.log(`RestAPI listening on port ${port}!`));

// LOGIN (sjekk passord mot hash, og sett sesjonID)
app.post('/login', (req, res) => { 
    var data = {
        // xmlparser fungerer ikke? får undefined values
        brukerID: req.body.brukerID,
        passord: req.body.passord
    }
    //res.send("brukerID " + data.brukerID);
    //res.send("passord" + data.passord);
    console.log(data.brukerID);
    console.log(data.passord);
    
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
        sesjonID: req.SessionID
    }
    
    var SQL = 'DELETE FROM sesjon WHERE sesjonID = ?';
    db.run(SQL, data.sesjonID, (err, row) => {
        if(err){
            res.send("select parameters wrong/ or sesjonID gone");
        }
        else{
            res.send("SesjonID deleted");
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
            res.setHeader('content-type', 'text/xml');
            res.send(js2xmlparser.parse("Forfatter" , row));
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
            res.send(js2xmlparser.parse("Forfatter" , row));
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
        forfatterID: req.body.forfatterID,
        fornavn: req.body.fornavn,
        etternavn: req.body.etternavn,
        nasjonalitet: req.body.nasjonalitet
    }
    console.log(data);
    // Validerer at brukeren er logget inn
    var sesjonID = req.SessionID
    var SQL = 'SELECT sesjonID FROM sesjon WHERE sesjonID = ?';
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null){
            if(sesjonID == row.sesjonID){
                // Brukeren er nå validert
                // Setter inn data
                var SQL = `INSERT INTO forfatter(forfatterID, fornavn, etternavn, nasjonalitet) VALUES(?,?,?,?);`;
                db.run(SQL, data, (err) => {
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
        forfatterID: req.body.forfatterID,
        fornavn: req.body.fornavn,
        etternavn: req.body.etternavn,
        nasjonalitet: req.body.nasjonalitet
    }
    console.log(data);
    // Validerer at brukeren er logget inn
    var sesjonID = req.SessionID
    var SQL = 'SELECT sesjonID FROM sesjon WHERE sesjonID = ?';
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null){
            if(sesjonID == row.sesjonID){
                // Brukeren er nå validert
                // Setter inn data hvis det er data som skal oppdateres! (settes ut ifra forfatterID)
                if (req.body.fornavn) {
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
                else if (req.body.etternavn) {
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
                else if (req.body.nasjonalitet) {
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

// Slette en post eller alle poster - forfatter
app.delete('/forfatter', (req, res) => {
    var data = {
        forfatterID: req.body.forfatterID
    }
    console.log(data);
    sesjonID = req.SessionID
    var SQL = `SELECT sesjonID FROM sesjon WHERE sesjonID = ?`;
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null) {
            if (sesjonID == row.sesjonID) {
                // Brukeren er nå validert
                // Sletter ønsket data
                if (req.body.forfatterID) {
    	           var SQL = `DELETE FROM forfatter WHERE forfatterID = ?`;
    	           db.run(SQL, data.forfatterID, (err) => {
        	           if(err) {
            	           res.send("Something went wrong!");
        	           } else {
            	           res.send("forfatter " + data.forfatterID + " slettet");
        	           }
                   });
                } 
                // Hvis forfatterID ikke er definert slettes alle
                else {
    	           var SQL = `DELETE * FROM forfatter`;
    	           db.run(SQL, (err) => {
        	           if(err) {
            	           console.log("Something went wrong!");
        	           } else {
            	           console.log("Tabell forfatter er slettet");
            	           res.send("Tabell forfatter er slettet");
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
            res.send(js2xmlparser.parse("Forfatter" , row));
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
            res.send(js2xmlparser.parse("Bok" , row));
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
        bokID: req.body.bokID,
        tittel: req.body.tittel,
        forfatterID: req.body.forfatterID
    }
    console.log(data);
    // Validerer at brukeren er logget inn
    var sesjonID = req.SessionID
    var SQL = 'SELECT sesjonID FROM sesjon WHERE sesjonID = ?';
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null){
            if(sesjonID == row.sesjonID){
                // Brukeren er nå validert
                // Setter inn data
                var SQL = `INSERT INTO bok(bokID, tittel, forfatterID) VALUES(?,?,?);`;
                db.run(SQL, data, (err) => {
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
        bokID: req.body.bokID,
        tittel: req.body.tittel,
        forfatterID: req.body.forfatterID,
    }
    console.log(data);
    // Validerer at brukeren er logget inn
    var sesjonID = req.SessionID
    var SQL = 'SELECT sesjonID FROM sesjon WHERE sesjonID = ?';
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null){
            if(sesjonID == row.sesjonID){
                // Brukeren er nå validert
                // Setter inn data hvis det er data som skal oppdateres! (settes ut ifra bokID)
                if (req.body.tittel) {
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
                else if (req.body.forfatterID) {
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
        bokID: req.body.bokID
    }
    console.log(data);
    sesjonID = req.SessionID
    var SQL = `SELECT sesjonID FROM sesjon WHERE sesjonID = ?`;
    db.get(SQL, sesjonID, (err, row) => {
        if(row != null) {
            if (sesjonID == row.sesjonID) {
                // Brukeren er nå validert
                // Sletter ønsket data
                if (req.body.bokID) {
    	           var SQL = `DELETE FROM bok WHERE bokID = ?`;
    	           db.run(SQL, data.bokID, (err) => {
        	           if(err) {
            	           res.send("Something went wrong!");
        	           } else {
            	           res.send("Bok: " + data.bokID + " slettet");
        	           }
                   });
                } 
                // Hvis bokID ikke er definert slettes alle
                else {
    	           var SQL = `DELETE * FROM bok`;
    	           db.run(SQL, (err) => {
        	           if(err) {
            	           console.log("Something went wrong!");
        	           } else {
            	           console.log("Tabell bok er slettet");
            	           res.send("Tabell bok er slettet");
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