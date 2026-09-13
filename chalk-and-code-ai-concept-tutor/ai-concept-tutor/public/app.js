// app.js
// Plain JS. Two screens handled with simple state + re-render:
// ASK (enter a concept) -> RESULT (explanation, analogy, practice question,
// and a free-text answer box that gets checked by the AI).

const app = document.getElementById('app');
const historyList = document.getElementById('history-list');

const state = {
  screen: 'ask',
  level: 'beginner',
  current: null, // { concept, explanation, analogy, practiceQuestion }
};

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

function render() {
  if (state.screen === 'ask') renderAsk();
  else if (state.screen === 'result') renderResult();
}

function renderAsk() {
  app.innerHTML = `
    <h2>What are you stuck on?</h2>
    <p>Type any coding or software concept — "recursion", "APIs", "for loops", "what a database is" — and get a simple explanation built for you.</p>

    <div class="field">
      <label for="concept-input">Concept</label>
      <input type="text" id="concept-input" placeholder="e.g. recursion" maxlength="80" />
    </div>

    <div class="level-toggle">
      <button class="level-btn ${state.level === 'beginner' ? 'active' : ''}" data-level="beginner">Beginner</button>
      <button class="level-btn ${state.level === 'intermediate' ? 'active' : ''}" data-level="intermediate">Intermediate</button>
    </div>

    <button class="btn-primary" id="ask-btn">Explain it</button>
    <p id="ask-error" class="error-text"></p>
  `;

  document.querySelectorAll('.level-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.level = btn.dataset.level;
      render();
    });
  });

  const input = document.getElementById('concept-input');
  const askBtn = document.getElementById('ask-btn');

  askBtn.addEventListener('click', async () => {
    const concept = input.value.trim();
    if (!concept) {
      document.getElementById('ask-error').textContent = 'Type a concept first.';
      return;
    }

    askBtn.disabled = true;
    askBtn.textContent = 'Thinking…';

    try {
      const result = await apiPost('/api/explain', { concept, level: state.level });
      state.current = result;
      state.screen = 'result';
      render();
      loadHistory();
    } catch (err) {
      document.getElementById('ask-error').textContent = err.message;
      askBtn.disabled = false;
      askBtn.textContent = 'Explain it';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') askBtn.click();
  });

  input.focus();
}

function renderResult() {
  const c = state.current;

  app.innerHTML = `
    <span class="result-label">${c.concept} — ${state.level}</span>
    <h2>Here's the idea</h2>
    <p>${c.explanation}</p>

    <div class="analogy-box">
      <strong>Think of it like this:</strong>
      <p style="margin: 6px 0 0;">${c.analogy}</p>
    </div>

    <div class="question-box">
      <strong>Try this:</strong>
      <p style="margin: 6px 0 0;">${c.practiceQuestion}</p>
    </div>

    <div class="field">
      <label for="answer-input">Your answer</label>
      <textarea id="answer-input" rows="3" placeholder="Write your answer here…"></textarea>
    </div>

    <button class="btn-primary" id="check-btn">Check my answer</button>
    <div id="feedback-slot"></div>

    <div class="actions">
      <button class="btn-primary" id="new-btn">Ask about something else</button>
    </div>
  `;

  document.getElementById('new-btn').addEventListener('click', () => {
    state.screen = 'ask';
    state.current = null;
    render();
  });

  const checkBtn = document.getElementById('check-btn');
  checkBtn.addEventListener('click', async () => {
    const answer = document.getElementById('answer-input').value.trim();
    if (!answer) return;

    checkBtn.disabled = true;
    checkBtn.textContent = 'Checking…';

    try {
      const feedback = await apiPost('/api/check-answer', {
        concept: c.concept,
        practiceQuestion: c.practiceQuestion,
        studentAnswer: answer,
      });

      const feedbackClass = feedback.correct ? '' : 'needs-work';
      document.getElementById('feedback-slot').innerHTML = `
        <div class="feedback ${feedbackClass}">
          <strong>${feedback.correct ? 'Nice — that shows understanding.' : 'Getting there.'}</strong>
          <p style="margin: 6px 0 0;">${feedback.feedback}</p>
        </div>
      `;
    } catch (err) {
      document.getElementById('feedback-slot').innerHTML = `<p class="error-text">${err.message}</p>`;
    }

    checkBtn.disabled = false;
    checkBtn.textContent = 'Check my answer';
  });
}

async function loadHistory() {
  try {
    const items = await apiGet('/api/history');
    if (items.length === 0) {
      historyList.innerHTML = '<li class="muted">Nothing yet — ask about something.</li>';
      return;
    }
    historyList.innerHTML = items
      .map((i) => `<li><span>${i.concept}</span><span>${i.level}</span></li>`)
      .join('');
  } catch (err) {
    historyList.innerHTML = '<li class="muted">Could not load history.</li>';
  }
}

render();
loadHistory();
