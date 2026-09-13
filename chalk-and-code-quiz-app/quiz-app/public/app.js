// app.js
// Plain JavaScript — no framework — so the API/DOM relationship stays easy
// to trace end-to-end for teaching purposes.
//
// Flow: START screen (name) -> QUIZ screen (one question at a time,
// answers checked via the API) -> RESULTS screen (score + leaderboard).

const app = document.getElementById('app');

const state = {
  screen: 'start',
  playerName: '',
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
};

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request to ${url} failed`);
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request to ${url} failed`);
  return res.json();
}

function render() {
  if (state.screen === 'start') renderStart();
  else if (state.screen === 'quiz') renderQuiz();
  else if (state.screen === 'results') renderResults();
}

function renderStart() {
  app.innerHTML = `
    <h2>Ready to test what you know?</h2>
    <p>Eight quick questions on how software actually fits together — variables, APIs, databases, and using AI well.</p>
    <div class="field">
      <label for="name-input">What should we call you?</label>
      <input type="text" id="name-input" placeholder="Your name" maxlength="40" />
    </div>
    <button class="btn-primary" id="start-btn">Start quiz</button>
    <p id="start-error" class="error-text"></p>
  `;

  const input = document.getElementById('name-input');
  const startBtn = document.getElementById('start-btn');

  startBtn.addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) {
      document.getElementById('start-error').textContent = 'Please enter a name first.';
      return;
    }
    state.playerName = name;
    startBtn.disabled = true;
    startBtn.textContent = 'Loading questions…';

    try {
      state.questions = await apiGet('/api/questions');
      state.currentIndex = 0;
      state.score = 0;
      state.screen = 'quiz';
      render();
    } catch (err) {
      document.getElementById('start-error').textContent = 'Could not reach the server. Is it running?';
      startBtn.disabled = false;
      startBtn.textContent = 'Start quiz';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startBtn.click();
  });
}

function renderQuiz() {
  const q = state.questions[state.currentIndex];
  const total = state.questions.length;

  const dashes = state.questions
    .map((_, i) => `<span class="${i < state.currentIndex ? 'done' : ''}"></span>`)
    .join('');

  app.innerHTML = `
    <div class="progress">${dashes}</div>
    <span class="category-tag">${q.category}</span>
    <h2>${q.prompt}</h2>
    <div class="options">
      ${['a', 'b', 'c', 'd']
        .map(
          (letter) => `
        <button class="option" data-letter="${letter}">
          <span class="letter">${letter.toUpperCase()}</span>
          <span>${q['option_' + letter]}</span>
        </button>
      `
        )
        .join('')}
    </div>
    <div id="feedback-slot"></div>
    <div class="actions" id="actions-slot"></div>
  `;

  state.answered = false;

  document.querySelectorAll('.option').forEach((btn) => {
    btn.addEventListener('click', () => handleAnswer(btn.dataset.letter, q.id));
  });

  document.getElementById('actions-slot').innerHTML = `
    <span style="color: var(--chalk-dim); font-size: 0.8rem;">Question ${state.currentIndex + 1} of ${total}</span>
  `;
}

async function handleAnswer(letter, questionId) {
  if (state.answered) return;
  state.answered = true;

  const optionButtons = document.querySelectorAll('.option');
  optionButtons.forEach((btn) => (btn.disabled = true));

  let result;
  try {
    result = await apiPost('/api/answer', { questionId, selected: letter });
  } catch (err) {
    document.getElementById('feedback-slot').innerHTML =
      '<p class="error-text">Could not check that answer — is the server running?</p>';
    state.answered = false;
    optionButtons.forEach((btn) => (btn.disabled = false));
    return;
  }

  optionButtons.forEach((btn) => {
    if (btn.dataset.letter === result.correctOption) btn.classList.add('correct');
    else if (btn.dataset.letter === letter) btn.classList.add('incorrect');
  });

  if (result.correct) state.score += 1;

  const feedbackClass = result.correct ? '' : 'wrong';
  document.getElementById('feedback-slot').innerHTML = `
    <div class="feedback ${feedbackClass}">
      <strong>${result.correct ? 'Correct.' : 'Not quite.'}</strong>
      <p style="margin: 6px 0 0;">${result.explanation}</p>
    </div>
  `;

  const isLast = state.currentIndex === state.questions.length - 1;

  document.getElementById('actions-slot').innerHTML = `
    <button class="btn-primary" id="next-btn">${isLast ? 'See results' : 'Next question'}</button>
  `;

  document.getElementById('next-btn').addEventListener('click', async () => {
    if (isLast) {
      await finishQuiz();
    } else {
      state.currentIndex += 1;
      render();
    }
  });
}

async function finishQuiz() {
  try {
    await apiPost('/api/scores', {
      playerName: state.playerName,
      score: state.score,
      total: state.questions.length,
    });
  } catch (err) {
    // If saving fails, still show the player their result.
    console.error('Could not save score', err);
  }
  state.screen = 'results';
  render();
}

async function renderResults() {
  app.innerHTML = `
    <h2>Nice work, ${state.playerName}.</h2>
    <div class="score-line">${state.score} / ${state.questions.length}</div>
    <p>Here's how recent scores compare:</p>
    <ul class="leaderboard" id="leaderboard-list"><li>Loading…</li></ul>
    <div class="actions">
      <button class="btn-primary" id="retry-btn">Play again</button>
    </div>
  `;

  document.getElementById('retry-btn').addEventListener('click', () => {
    state.screen = 'start';
    render();
  });

  try {
    const scores = await apiGet('/api/scores');
    const list = document.getElementById('leaderboard-list');
    if (scores.length === 0) {
      list.innerHTML = '<li>No scores yet — you\'re the first.</li>';
      return;
    }
    list.innerHTML = scores
      .map(
        (s) => `<li><span>${s.playerName}</span><span>${s.score}/${s.total}</span></li>`
      )
      .join('');
  } catch (err) {
    document.getElementById('leaderboard-list').innerHTML =
      '<li class="error-text">Could not load the leaderboard.</li>';
  }
}

render();
