// ai.js
// A small wrapper around the Anthropic API. Keeping this in its own file
// makes the "AI integration" boundary obvious and easy to point to when
// explaining the project — everything the AI is asked to do lives here.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';

async function callClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.'
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = data.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : '';
}

// Extracts the first {...} JSON object from a string, in case the model
// wraps its JSON in a sentence or code fence despite instructions.
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI response did not contain JSON.');
  return JSON.parse(match[0]);
}

// Asks the AI to explain a concept simply, give one analogy, and propose
// one short practice question the student can be tested on next.
async function explainConcept(concept, level) {
  const systemPrompt = `You are a patient coding tutor for school students.
Explain the given concept at a ${level} level, in plain language, in 2-4 short sentences.
Then give one concrete, everyday analogy (not a coding one) that makes it click.
Then write one short practice question a student could answer to show they understood it.
Respond with ONLY a JSON object, no other text, in exactly this shape:
{"explanation": "...", "analogy": "...", "practiceQuestion": "..."}`;

  const raw = await callClaude(systemPrompt, `Concept: ${concept}`);
  return extractJson(raw);
}

// Asks the AI to check a student's free-text answer to the practice
// question and give short, encouraging, specific feedback.
async function checkAnswer(concept, practiceQuestion, studentAnswer) {
  const systemPrompt = `You are a patient coding tutor giving feedback on a student's answer.
Concept being tested: "${concept}"
Question asked: "${practiceQuestion}"
Judge the student's answer for understanding, not exact wording.
Respond with ONLY a JSON object, no other text, in exactly this shape:
{"correct": true or false, "feedback": "2-3 encouraging sentences explaining what was right or what to fix"}`;

  const raw = await callClaude(systemPrompt, `Student's answer: ${studentAnswer}`);
  return extractJson(raw);
}

module.exports = { explainConcept, checkAnswer };
