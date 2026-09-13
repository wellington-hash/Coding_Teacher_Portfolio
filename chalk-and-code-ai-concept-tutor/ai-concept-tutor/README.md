# Chalk & Code — AI Concept Tutor

A small full-stack app that uses an AI API as a real feature, not a demo:
type in a concept you're stuck on, and it generates a plain-language
explanation, a real-world analogy, and a practice question — then checks
your answer to that question and gives feedback.

This is the companion project to the [Chalk & Code quiz app](../quiz-app),
using the same visual identity but focused on AI integration specifically.

## What it does

1. You type a concept ("recursion", "what an API is", "for loops") and pick
   a difficulty level.
2. The backend sends a prompt to the Anthropic API asking for an
   explanation, an analogy, and a short practice question — returned as
   structured JSON.
3. You answer the practice question in your own words.
4. The backend sends your answer back to the AI to be judged for
   understanding (not exact wording), and shows you feedback.
5. Every lookup is saved to a local database, shown as "recently asked."

## How it's built

```
ai-concept-tutor/
├── server.js       # Express server + REST API
├── ai.js           # All AI-prompting logic lives here, isolated
├── database.js     # SQLite schema for lookup history
├── .env.example    # Shows what environment variable is needed
└── public/         # Frontend (plain HTML/CSS/JS)
```

**Why the AI logic is in its own file (`ai.js`)**
Keeping every prompt and API call in one place makes the "AI boundary" of
the app obvious — useful both for maintaining the app and for explaining,
in an interview or to a student, exactly what the AI is being asked to do
and how its output is used.

**Why the AI is asked to return JSON**
Rather than free-form text, the prompts ask for a strict JSON shape
(`{"explanation": ..., "analogy": ..., "practiceQuestion": ...}`). This is
a genuinely important pattern in real AI-integrated apps: it turns an AI
response into structured data the rest of the app can reliably use, rather
than trying to parse free text.

**Why answer-checking is a separate AI call**
Judging whether a free-text answer shows real understanding isn't
something you can do with simple string matching — it needs
comprehension, which is what the second AI call is for. This mirrors a
common real pattern: use AI for the parts that genuinely need judgement,
and plain code for everything else (routing, storage, validation).

## Running it locally

You'll need an Anthropic API key: create one at
<https://console.anthropic.com/>.

```bash
npm install
cp .env.example .env
# then edit .env and paste in your key
node server.js
```

Then open `http://localhost:3001`.

## How AI was used to build this project

- Used AI to help design the two prompts (explain / check-answer) and to
  get the JSON-shape instruction right so responses parse reliably.
- Used AI to scaffold the Express routes and frontend state machine, then
  read through each one to understand it — particularly how the practice
  question flows from the first AI call into the second.
- Manually tested each API route directly (via `curl`) before wiring up
  the frontend, including confirming the app fails with a clear error
  message when no API key is configured, rather than crashing silently.

## Possible extensions

- Let a teacher review the history of concepts students have asked about,
  to spot common sticking points
- Add a "simpler, please" button that re-asks for an even plainer
  explanation of the same concept
- Rate-limit or cache repeated lookups of the same concept to reduce API
  calls
