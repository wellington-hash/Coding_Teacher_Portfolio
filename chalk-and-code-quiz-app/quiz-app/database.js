// database.js
// Sets up a local SQLite database and seeds it with quiz questions the
// first time the app runs. Using a real relational database here (rather
// than a JSON file) so the project demonstrates actual SQL: schema design,
// inserts, and queries.

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'quiz.db'));

// Two tables:
// - questions: the quiz content itself
// - scores: a simple leaderboard of past attempts
db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL, -- 'a' | 'b' | 'c' | 'd'
    explanation TEXT NOT NULL,
    category TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Only seed questions once, so re-running the server doesn't duplicate rows.
const questionCount = db.prepare('SELECT COUNT(*) AS count FROM questions').get().count;

if (questionCount === 0) {
  const seedQuestions = [
    {
      prompt: 'What does a "variable" store in a program?',
      option_a: 'A fixed value that can never change',
      option_b: 'A named piece of data that a program can read or update',
      option_c: 'A type of loop',
      option_d: 'A picture on the screen',
      correct_option: 'b',
      explanation: 'A variable is just a labelled box for data — its value can be read and changed while the program runs.',
      category: 'Fundamentals',
    },
    {
      prompt: 'Which of these best describes a "function"?',
      option_a: 'A block of reusable code that performs a task',
      option_b: 'A place where a website is hosted',
      option_c: 'A type of database',
      option_d: 'A picture format',
      correct_option: 'a',
      explanation: 'Functions bundle up steps you want to reuse, so you can call them by name instead of repeating code.',
      category: 'Fundamentals',
    },
    {
      prompt: 'What is an API used for?',
      option_a: 'Styling a webpage',
      option_b: 'Letting two programs talk to each other',
      option_c: 'Storing files permanently',
      option_d: 'Drawing shapes on screen',
      correct_option: 'b',
      explanation: 'An API (Application Programming Interface) defines how one piece of software can request data or actions from another.',
      category: 'Architecture',
    },
    {
      prompt: 'In a typical web app, what is the "backend" responsible for?',
      option_a: 'Only the colours and layout',
      option_b: 'Running logic, talking to the database, and responding to requests',
      option_c: 'Nothing, it is just a name',
      option_d: 'Playing sound effects',
      correct_option: 'b',
      explanation: 'The backend handles the logic and data behind the scenes, while the frontend is what the user sees and interacts with.',
      category: 'Architecture',
    },
    {
      prompt: 'What is a database mainly used for?',
      option_a: 'Storing and organising data so it can be searched and reused',
      option_b: 'Making a website load images faster',
      option_c: 'Writing CSS styles',
      option_d: 'Sending emails',
      correct_option: 'a',
      explanation: 'A database stores structured data (like user accounts or quiz scores) so an app can save, search, and update it reliably.',
      category: 'Architecture',
    },
    {
      prompt: 'What does "debugging" mean?',
      option_a: 'Deleting all your code and starting over',
      option_b: 'Finding and fixing errors in a program',
      option_c: 'Making a program run faster only',
      option_d: 'Designing a logo',
      correct_option: 'b',
      explanation: 'Debugging is the process of tracking down why something isn\u2019t working as expected, then fixing it.',
      category: 'Process',
    },
    {
      prompt: 'If a loop runs 5 times printing "i", what kind of concept is "i" usually called?',
      option_a: 'A counter or loop variable',
      option_b: 'A database table',
      option_c: 'An API key',
      option_d: 'A stylesheet',
      correct_option: 'a',
      explanation: 'A loop variable (often "i") keeps track of which repetition the loop is currently on.',
      category: 'Fundamentals',
    },
    {
      prompt: 'When using an AI tool to help write code, what is the most important habit?',
      option_a: 'Copy the code without reading it, to save time',
      option_b: 'Read and understand what the code does before using it',
      option_c: 'Only use AI for the final polished version',
      option_d: 'Avoid testing AI-generated code',
      correct_option: 'b',
      explanation: 'AI tools speed up writing code, but understanding what it does is what lets you catch mistakes and actually learn.',
      category: 'AI & Process',
    },
  ];

  const insert = db.prepare(`
    INSERT INTO questions
      (prompt, option_a, option_b, option_c, option_d, correct_option, explanation, category)
    VALUES
      (@prompt, @option_a, @option_b, @option_c, @option_d, @correct_option, @explanation, @category)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  insertMany(seedQuestions);
  console.log(`Seeded ${seedQuestions.length} quiz questions.`);
}

module.exports = db;
