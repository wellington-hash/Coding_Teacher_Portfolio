# Chalk & Code — a learning quiz app

A small full-stack quiz app built to practice (and demonstrate) how a
frontend, backend, API, and database fit together — the same concepts
covered in the quiz itself: variables, functions, APIs, backends, and
databases.

## What it does

Players enter their name, answer 8 questions about core programming and
software concepts one at a time, get instant feedback with an explanation,
and see their score saved to a small leaderboard.

## How it's built

```
quiz-app/
├── server.js       # Express server + REST API
├── database.js     # SQLite schema + seed data
├── package.json
└── public/         # Frontend (plain HTML/CSS/JS, no framework)
    ├── index.html
    ├── style.css
    └── app.js
```

**Backend — Node.js + Express + SQLite (`better-sqlite3`)**
The server exposes four endpoints:

| Method | Route             | What it does                                      |
|--------|-------------------|----------------------------------------------------|
| GET    | `/api/questions`  | Returns all questions *without* the correct answer |
| POST   | `/api/answer`     | Checks a submitted answer server-side              |
| POST   | `/api/scores`     | Saves a completed attempt to the database          |
| GET    | `/api/scores`     | Returns the top 10 scores for the leaderboard      |

Correct answers are checked on the server, not the browser — the frontend
never receives the answer key up front. This mirrors how a real quiz or
exam platform is built, and is a good talking point on API design.

**Database — SQLite**
Two tables: `questions` (seeded once on first run) and `scores` (grows as
people play). Using a real relational database, even a lightweight one,
demonstrates schema design, inserts, and queries rather than just reading
a JSON file.

**Frontend — plain HTML/CSS/JS**
No framework, so the DOM ↔ fetch ↔ API relationship stays easy to trace
line by line — useful when using this as a teaching example. The three
screens (start → quiz → results) are handled with a small state object and
re-render function in `app.js`.

## Running it locally

```bash
npm install
node server.js
```

Then open `http://localhost:3000`.

The database file (`quiz.db`) is created automatically on first run and is
excluded from version control — see `.gitignore`.

## How AI was used to build this

This project was built with AI assistance (Claude) as part of learning to
use AI as a genuine part of the development process, not just to generate
a finished result:

- Turned a plain-English idea ("a quiz app for learning") into a concrete
  spec: which endpoints were needed, how the database should be shaped,
  and what the answer-checking flow should look like.
- Used AI to generate the first draft of each file, then read through it
  to understand exactly what it does — the API routes, the SQL schema, and
  the frontend state machine — rather than accepting it unread.
- Tested the API directly (via `curl`) to confirm each endpoint actually
  worked before trusting the frontend to call it.
- Iterated on the design so it wouldn't look like a generic template —
  the chalkboard theme ties the visual identity to the "learning" subject
  matter directly.

## Possible extensions

- Add more question categories or a difficulty setting
- Add user accounts so players can track progress over time
- Deploy it (e.g. Render, Railway, or Fly.io) so it's live and shareable
- Swap in a hosted database (e.g. MySQL or Postgres) to practice a
  production-style setup
