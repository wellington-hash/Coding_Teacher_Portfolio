// server.js
// Express backend that wires together: the frontend, the database, and
// the AI API. This is the file that shows how those three pieces meet.

require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./database');
const { explainConcept, checkAnswer } = require('./ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/explain
// Body: { concept, level }  where level is 'beginner' | 'intermediate'
// Calls the AI to generate an explanation + analogy + practice question,
// saves it to the database, and returns it to the frontend.
app.post('/api/explain', async (req, res) => {
  const { concept, level } = req.body;

  if (!concept || !concept.trim()) {
    return res.status(400).json({ error: 'Please provide a concept to explain.' });
  }

  const safeLevel = level === 'intermediate' ? 'intermediate' : 'beginner';

  try {
    const result = await explainConcept(concept.trim(), safeLevel);

    const insert = db.prepare(`
      INSERT INTO lookups (concept, level, explanation, analogy, practice_question)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = insert.run(
      concept.trim(),
      safeLevel,
      result.explanation,
      result.analogy,
      result.practiceQuestion
    );

    res.json({ id: info.lastInsertRowid, concept: concept.trim(), ...result });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message });
  }
});

// POST /api/check-answer
// Body: { concept, practiceQuestion, studentAnswer }
// Calls the AI to judge the student's free-text answer.
app.post('/api/check-answer', async (req, res) => {
  const { concept, practiceQuestion, studentAnswer } = req.body;

  if (!studentAnswer || !studentAnswer.trim()) {
    return res.status(400).json({ error: 'Please write an answer first.' });
  }

  try {
    const result = await checkAnswer(concept, practiceQuestion, studentAnswer.trim());
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message });
  }
});

// GET /api/history
// Returns the 10 most recent lookups, for a "recently explained" list.
app.get('/api/history', (req, res) => {
  const rows = db
    .prepare('SELECT concept, level, created_at AS createdAt FROM lookups ORDER BY id DESC LIMIT 10')
    .all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`AI Concept Tutor running at http://localhost:${PORT}`);
});
