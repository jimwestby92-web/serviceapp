const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const db = new Database('jobber.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS jobber (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kundenavn TEXT NOT NULL,
    hva TEXT NOT NULL,
    hvor TEXT,
    beskrivelse TEXT,
    dato TEXT NOT NULL,
    status TEXT DEFAULT 'Ny',
    opprettet TEXT DEFAULT (datetime('now'))
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Hent alle jobber
app.get('/api/jobber', (req, res) => {
  const jobber = db.prepare('SELECT * FROM jobber ORDER BY dato DESC, id DESC').all();
  res.json(jobber);
});

// Legg til jobb
app.post('/api/jobber', (req, res) => {
  const { kundenavn, hva, hvor, beskrivelse, dato } = req.body;
  if (!kundenavn || !hva || !dato) {
    return res.status(400).json({ feil: 'Kundenavn, hva og dato er påkrevd.' });
  }
  const result = db.prepare(
    'INSERT INTO jobber (kundenavn, hva, hvor, beskrivelse, dato) VALUES (?, ?, ?, ?, ?)'
  ).run(kundenavn, hva, hvor || '', beskrivelse || '', dato);
  const jobb = db.prepare('SELECT * FROM jobber WHERE id = ?').get(result.lastInsertRowid);
  res.json(jobb);
});

// Oppdater status
app.put('/api/jobber/:id/status', (req, res) => {
  const { status } = req.body;
  const gyldige = ['Ny', 'Pågår', 'Fullført'];
  if (!gyldige.includes(status)) {
    return res.status(400).json({ feil: 'Ugyldig status.' });
  }
  db.prepare('UPDATE jobber SET status = ? WHERE id = ?').run(status, req.params.id);
  const jobb = db.prepare('SELECT * FROM jobber WHERE id = ?').get(req.params.id);
  res.json(jobb);
});

// Slett jobb
app.delete('/api/jobber/:id', (req, res) => {
  db.prepare('DELETE FROM jobber WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
});
