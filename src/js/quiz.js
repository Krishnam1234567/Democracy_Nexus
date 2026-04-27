/**
 * @fileoverview Interactive Quiz module for election knowledge testing.
 * Handles question rendering, scoring, timer, and results display.
 * @module quiz
 */

import electionData from '../data/election-data.json';
import { sanitizeHTML } from './security.js';
import { announce } from './accessibility.js';
import { trackQuizComplete } from './analytics.js';
import { saveQuizScore, getLeaderboard } from './firestore.js';

/** @type {Array<Object>} Current quiz questions */
let questions = [];

/** @type {number} Current question index */
let currentQuestion = 0;

/** @type {number} Current score */
let score = 0;

/** @type {number} Timer interval ID */
let timerInterval = null;

/** @type {number} Seconds remaining for current question */
let timeRemaining = 30;

/** @type {number} Total time taken */
let totalTimeTaken = 0;

/** @type {string} Selected difficulty */
let selectedDifficulty = 'beginner';

/** @type {string} Selected category */
let selectedCategory = 'all';

/** @type {boolean} Whether the quiz is currently active */
let isActive = false;

/** Number of questions per quiz */
const QUESTIONS_PER_QUIZ = 10;

/** Time per question in seconds */
const TIME_PER_QUESTION = 30;

/**
 * Initializes the quiz module.
 * Sets up event listeners for the quiz setup panel.
 */
export function initQuiz() {
  const startBtn = document.getElementById('quiz-start-btn');
  const retryBtn = document.getElementById('quiz-retry-btn');
  const newBtn = document.getElementById('quiz-new-btn');
  const nextBtn = document.getElementById('quiz-next-btn');

  if (startBtn) {
    startBtn.addEventListener('click', startQuiz);
  }
  if (retryBtn) {
    retryBtn.addEventListener('click', retryQuiz);
  }
  if (newBtn) {
    newBtn.addEventListener('click', showSetup);
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', nextQuestion);
  }
}

/**
 * Starts a new quiz with the selected options.
 */
export function startQuiz() {
  // Get selected options
  const categoryRadio = document.querySelector('input[name="category"]:checked');
  const difficultyRadio = document.querySelector('input[name="difficulty"]:checked');

  selectedCategory = categoryRadio ? categoryRadio.value : 'all';
  selectedDifficulty = difficultyRadio ? difficultyRadio.value : 'beginner';

  // Filter and select questions
  questions = selectQuestions(selectedCategory, selectedDifficulty);

  if (questions.length === 0) {
    announce('No questions available for the selected options.');
    return;
  }

  // Reset state
  currentQuestion = 0;
  score = 0;
  totalTimeTaken = 0;
  isActive = true;

  // Show quiz, hide setup
  togglePanels('active');
  renderQuestion();

  announce(`Quiz started. ${questions.length} questions. Difficulty: ${selectedDifficulty}.`);
}

/**
 * Selects and shuffles quiz questions based on filters.
 *
 * @param {string} category - The category filter ('all' for no filter).
 * @param {string} difficulty - The difficulty level filter.
 * @returns {Array<Object>} Filtered and shuffled questions.
 */
export function selectQuestions(category, difficulty) {
  let filtered = [...electionData.quiz.questions];

  // Filter by category
  if (category !== 'all') {
    filtered = filtered.filter((q) => q.category === category);
  }

  // Filter by difficulty
  if (difficulty !== 'all') {
    filtered = filtered.filter((q) => q.difficulty === difficulty);
  }

  // Shuffle using Fisher-Yates algorithm
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  // Limit to max questions
  return filtered.slice(0, QUESTIONS_PER_QUIZ);
}

/**
 * Renders the current question and starts the timer.
 * @private
 */
function renderQuestion() {
  const question = questions[currentQuestion];
  if (!question) {
    return;
  }

  // Update question text
  const questionText = document.getElementById('question-text');
  if (questionText) {
    questionText.textContent = question.question;
  }

  // Update progress
  updateProgress();

  // Render answer options
  const answersContainer = document.getElementById('quiz-answers');
  if (answersContainer) {
    const labels = ['A', 'B', 'C', 'D'];
    answersContainer.innerHTML = question.options.map((option, index) => `
      <button
        class="answer-btn"
        id="answer-${index}"
        type="button"
        data-index="${index}"
        aria-label="Option ${labels[index]}: ${option}"
        role="radio"
        aria-checked="false"
      >
        <span class="answer-label">${labels[index]}</span>
        <span>${sanitizeHTML(option)}</span>
      </button>
    `).join('');

    // Attach click handlers
    answersContainer.querySelectorAll('.answer-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleAnswer(parseInt(btn.getAttribute('data-index'), 10)));
    });
  }

  // Hide explanation
  const explanation = document.getElementById('quiz-explanation');
  if (explanation) {
    explanation.hidden = true;
  }

  // Start timer
  startTimer();

  announce(`Question ${currentQuestion + 1} of ${questions.length}: ${question.question}`);
}

/**
 * Handles the user selecting an answer.
 *
 * @param {number} selectedIndex - The index of the selected answer.
 */
export function handleAnswer(selectedIndex) {
  if (!isActive) {
    return;
  }

  // Stop timer
  stopTimer();

  const question = questions[currentQuestion];
  const isCorrect = selectedIndex === question.correct;

  if (isCorrect) {
    score++;
  }

  totalTimeTaken += (TIME_PER_QUESTION - timeRemaining);

  // Disable all answer buttons
  const buttons = document.querySelectorAll('.answer-btn');
  buttons.forEach((btn) => {
    btn.disabled = true;
    const index = parseInt(btn.getAttribute('data-index'), 10);
    if (index === question.correct) {
      btn.classList.add('correct');
    } else if (index === selectedIndex && !isCorrect) {
      btn.classList.add('incorrect');
    }
  });

  // Show explanation
  showExplanation(isCorrect, question);

  // Update score display
  const scoreDisplay = document.getElementById('quiz-score-display');
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${score}`;
  }
}

/**
 * Displays the explanation panel after answering.
 *
 * @param {boolean} isCorrect - Whether the answer was correct.
 * @param {Object} question - The question object.
 * @private
 */
function showExplanation(isCorrect, question) {
  const explanation = document.getElementById('quiz-explanation');
  const header = document.getElementById('explanation-header');
  const text = document.getElementById('explanation-text');
  const nextBtn = document.getElementById('quiz-next-btn');

  if (!explanation || !header || !text) {
    return;
  }

  header.className = `explanation-header ${isCorrect ? 'correct' : 'incorrect'}`;
  header.textContent = isCorrect ? '✅ Correct!' : '❌ Incorrect';
  text.textContent = question.explanation;

  if (nextBtn) {
    nextBtn.textContent = currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results';
  }

  explanation.hidden = false;

  announce(isCorrect ? 'Correct answer!' : `Incorrect. The correct answer was: ${question.options[question.correct]}`);
}

/**
 * Advances to the next question or shows results.
 */
export function nextQuestion() {
  currentQuestion++;

  if (currentQuestion >= questions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

/**
 * Displays the quiz results with score and leaderboard.
 * @private
 */
async function showResults() {
  isActive = false;
  stopTimer();

  const percentage = Math.round((score / questions.length) * 100);

  togglePanels('results');

  // Animate result circle
  const progressCircle = document.getElementById('result-progress-circle');
  if (progressCircle) {
    const circumference = 2 * Math.PI * 45; // r=45
    const offset = circumference - (percentage / 100) * circumference;
    // Set stroke color based on score
    progressCircle.style.stroke = percentage >= 70 ? 'var(--color-success)' : percentage >= 40 ? 'var(--color-warning)' : 'var(--color-error)';
    setTimeout(() => {
      progressCircle.style.strokeDashoffset = offset;
    }, 100);
  }

  // Update result text
  const percentageEl = document.getElementById('result-percentage');
  if (percentageEl) {
    animateNumber(percentageEl, 0, percentage, '%');
  }

  const correctEl = document.getElementById('result-correct');
  if (correctEl) {
    correctEl.textContent = `Correct: ${score}/${questions.length}`;
  }

  const timeEl = document.getElementById('result-time');
  if (timeEl) {
    timeEl.textContent = `Total Time: ${totalTimeTaken}s`;
  }

  const gradeEl = document.getElementById('result-grade');
  if (gradeEl) {
    gradeEl.textContent = getGrade(percentage);
    gradeEl.style.color = percentage >= 70 ? 'var(--color-success)' : percentage >= 40 ? 'var(--color-warning)' : 'var(--color-error)';
  }

  // Save score to Firestore
  await saveQuizScore({
    score,
    total: questions.length,
    percentage,
    difficulty: selectedDifficulty,
    category: selectedCategory,
    timeTaken: totalTimeTaken
  });

  // Track quiz completion
  trackQuizComplete(percentage, selectedDifficulty, selectedCategory);

  // Load leaderboard
  await loadLeaderboard();

  announce(`Quiz complete! Your score: ${percentage}%. ${score} out of ${questions.length} correct.`);

  // Confetti for high scores
  if (percentage >= 80) {
    triggerConfetti();
  }
}

/**
 * Returns a grade string based on score percentage.
 *
 * @param {number} percentage - The score percentage.
 * @returns {string} Grade string.
 */
export function getGrade(percentage) {
  if (percentage >= 90) { return '🏆 Outstanding! Election Expert!'; }
  if (percentage >= 80) { return '🌟 Excellent! Democracy Champion!'; }
  if (percentage >= 70) { return '👍 Great job! Well Informed Citizen!'; }
  if (percentage >= 50) { return '📚 Good effort! Keep learning!'; }
  if (percentage >= 30) { return '🔄 Keep trying! Review the timeline.'; }
  return '📖 Study up! Explore our election resources.';
}

/**
 * Loads and displays the leaderboard from Firestore.
 * @private
 */
async function loadLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  if (!list) {
    return;
  }

  const entries = await getLeaderboard(10);

  if (entries.length === 0) {
    list.innerHTML = '<li class="leaderboard-entry"><span class="leaderboard-name">No scores yet. Be the first!</span></li>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  list.innerHTML = entries.map((entry, index) => `
    <li class="leaderboard-entry" id="leaderboard-${index}">
      <span class="leaderboard-rank">${medals[index] || (index + 1)}</span>
      <span class="leaderboard-name">${sanitizeHTML(entry.displayName)}</span>
      <span class="leaderboard-score">${entry.bestScore}%</span>
    </li>
  `).join('');
}

/**
 * Retries the quiz with the same settings.
 */
function retryQuiz() {
  startQuiz();
}

/**
 * Shows the quiz setup panel.
 */
function showSetup() {
  togglePanels('setup');
}

/**
 * Toggles visibility of quiz panels.
 *
 * @param {'setup'|'active'|'results'} panel - Which panel to show.
 * @private
 */
function togglePanels(panel) {
  const setup = document.getElementById('quiz-setup');
  const active = document.getElementById('quiz-active');
  const results = document.getElementById('quiz-results');

  if (setup) { setup.hidden = panel !== 'setup'; }
  if (active) { active.hidden = panel !== 'active'; }
  if (results) { results.hidden = panel !== 'results'; }
}

/**
 * Updates the progress bar and question counter.
 * @private
 */
function updateProgress() {
  const progress = ((currentQuestion) / questions.length) * 100;

  const fill = document.getElementById('progress-fill');
  if (fill) {
    fill.style.width = `${progress}%`;
  }

  const bar = document.getElementById('quiz-progress-bar');
  if (bar) {
    bar.setAttribute('aria-valuenow', String(Math.round(progress)));
  }

  const counter = document.getElementById('quiz-question-count');
  if (counter) {
    counter.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
  }
}

/**
 * Starts the countdown timer for the current question.
 * @private
 */
function startTimer() {
  timeRemaining = TIME_PER_QUESTION;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      stopTimer();
      // Auto-select incorrect (no answer)
      handleAnswer(-1);
    }
  }, 1000);
}

/**
 * Stops the countdown timer.
 * @private
 */
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Updates the timer display element.
 * @private
 */
function updateTimerDisplay() {
  const timer = document.getElementById('quiz-timer');
  if (timer) {
    timer.textContent = `⏱️ ${timeRemaining}s`;
    timer.style.color = timeRemaining <= 10 ? 'var(--color-error)' : timeRemaining <= 20 ? 'var(--color-warning)' : '';
  }
}

/**
 * Animates a number from start to end in an element.
 *
 * @param {HTMLElement} element - The element to update.
 * @param {number} start - Starting number.
 * @param {number} end - Ending number.
 * @param {string} [suffix=''] - Suffix to append (e.g., '%').
 * @private
 */
function animateNumber(element, start, end, suffix = '') {
  const duration = 1500;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * eased);
    element.textContent = `${current}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Creates a confetti animation for high scores.
 * @private
 */
function triggerConfetti() {
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = `${2 + Math.random() * 3}s`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.width = `${5 + Math.random() * 10}px`;
    confetti.style.height = `${5 + Math.random() * 10}px`;
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 5000);
  }
}

/**
 * Returns the current quiz state for testing or persistence.
 * @returns {Object} Current quiz state.
 */
export function getQuizState() {
  return {
    currentQuestion,
    score,
    totalQuestions: questions.length,
    isActive,
    selectedDifficulty,
    selectedCategory,
    timeRemaining
  };
}
