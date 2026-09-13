// server.js
// A small Express backend that:
//  - serves the frontend (public/)
//  - exposes a REST API for fetching questions, checking answers, and
//    saving/reading scores from the SQLite database.

const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/questions
// Returns all questions WITHOUT the correct answer or explanation, so the
// frontend can't just read the answer out of the network tab. This mirrors
// how a real quiz/exam API would behave.
app.get('/api/questions', (req, res) => {
  const rows = db
    .prepare('SELECT id, prompt, option_a, option_b, option_c, option_d, category FROM questions')
    .all();
  res.json(rows);
});

// POST /api/answer
// Body: { questionId, selected }  where selected is 'a' | 'b' | 'c' | 'd'
// Returns whether the answer was correct, plus an explanation either way.
app.post('/api/answer', (req, res) => {
  const { questionId, selected } = req.body;

  if (!questionId || !selected) {
    return res.status(400).json({ error: 'questionId and selected are required.' });
  }

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);

  if (!question) {
    return res.status(404).json({ error: 'Question not found.' });
  }

  const isCorrect = question.correct_option === selected;

  res.json({
    correct: isCorrect,
    correctOption: question.correct_option,
    explanation: question.explanation,
  });
});

// POST /api/scores
// Body: { playerName, score, total }
// Saves a completed quiz attempt to the scores table.
app.post('/api/scores', (req, res) => {
  const { playerName, score, total } = req.body;

  if (!playerName || score === undefined || total === undefined) {
    return res.status(400).json({ error: 'playerName, score and total are required.' });
  }

  const insert = db.prepare(
    'INSERT INTO scores (player_name, score, total) VALUES (?, ?, ?)'
  );
  const result = insert.run(playerName.trim().slice(0, 40), score, total);

  res.status(201).json({ id: result.lastInsertRowid });
});

// GET /api/scores
// Returns the top 10 scores, most recent first among ties, for a simple
// leaderboard on the frontend.
app.get('/api/scores', (req, res) => {
  const rows = db
    .prepare(
      `SELECT player_name AS playerName, score, total, created_at AS createdAt
       FROM scores
       ORDER BY (CAST(score AS FLOAT) / total) DESC, created_at DESC
       LIMIT 10`
    )
    .all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Quiz app running at http://localhost:${PORT}`);
});
