/* Bruker table henger sammen med sesjon */
CREATE TABLE bruker(
  brukerID      NUMBER,
  passordHash   TEXT,
  fornavn       TEXT,
  etternavn     TEXT,

  PRIMARY KEY (brukerID)
);

CREATE TABLE sesjon(
  sesjonID NUMBER,
  brukerID NUMBER,

  PRIMARY KEY(sesjonID),
  FOREIGN KEY (brukerID) REFERENCES bruker (brukerID)
);

/* forfatter table henger sammen med bok */
CREATE TABLE forfatter(
  forfatterID   NUMBER,
  fornavn       TEXT,
  etternavn     TEXT,
  nasjonalitet  TEXT,

  PRIMARY KEY (forfatterID)
);

CREATE TABLE bok(
  bokID       NUMBER,
  tittel      TEXT,
  forfatterID NUMBER,

  PRIMARY KEY (bokID),
  FOREIGN KEY (forfatterID) REFERENCES forfatter (forfatterID)
);
