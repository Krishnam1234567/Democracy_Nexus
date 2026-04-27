/**
 * @fileoverview Voter Readiness Checklist component.
 * Interactive checklist with progress tracking and age calculator.
 * @module checklist
 */

import electionData from '../data/election-data.json';
import { sanitizeHTML } from './security.js';
import { announce } from './accessibility.js';
import { trackChecklistAction } from './analytics.js';
import { saveChecklistProgress, getChecklistProgress } from './firestore.js';

/** @type {Object<string, boolean>} Current checklist completion state */
let checklistState = {};

/**
 * Initializes the checklist component.
 * Renders items, sets up handlers, and loads saved progress.
 */
export async function initChecklist() {
  renderChecklistItems();
  setupAgeCalculator();
  await loadProgress();
}

/**
 * Renders all checklist items from the data source.
 * @private
 */
function renderChecklistItems() {
  const container = document.getElementById('checklist-items');
  if (!container) {
    return;
  }

  const items = electionData.checklist;

  container.innerHTML = items.map((item) => createChecklistItem(item)).join('');

  // Attach change handlers
  container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      handleCheckboxChange(e.target.id.replace('checkbox-', ''), e.target.checked);
    });
  });
}

/**
 * Creates the HTML for a single checklist item.
 *
 * @param {Object} item - The checklist item data.
 * @returns {string} HTML string for the item.
 * @private
 */
function createChecklistItem(item) {
  const checked = checklistState[item.id] || false;

  return `
    <div class="checklist-item ${checked ? 'completed' : ''}" id="item-${item.id}" role="listitem">
      <div class="checklist-checkbox">
        <input
          type="checkbox"
          id="checkbox-${item.id}"
          ${checked ? 'checked' : ''}
          aria-label="Mark ${item.title} as complete"
        />
        <label for="checkbox-${item.id}" class="checkbox-custom" aria-hidden="true">
          ${checked ? '✓' : ''}
        </label>
      </div>
      <div class="checklist-content">
        <h3>${sanitizeHTML(item.icon)} ${sanitizeHTML(item.title)}</h3>
        <p>${sanitizeHTML(item.description)}</p>
        ${item.link ? `<a href="${sanitizeHTML(item.link)}" class="checklist-link" target="_blank" rel="noopener noreferrer">${sanitizeHTML(item.linkText)}</a>` : ''}
      </div>
    </div>
  `;
}

/**
 * Handles checkbox state changes, updates progress, and persists.
 *
 * @param {string} itemId - The checklist item ID.
 * @param {boolean} checked - Whether the item is checked.
 * @private
 */
async function handleCheckboxChange(itemId, checked) {
  checklistState[itemId] = checked;

  // Update UI
  const itemEl = document.getElementById(`item-${itemId}`);
  if (itemEl) {
    if (checked) {
      itemEl.classList.add('completed');
    } else {
      itemEl.classList.remove('completed');
    }
  }

  // Update checkbox visual
  const label = itemEl?.querySelector('.checkbox-custom');
  if (label) {
    label.textContent = checked ? '✓' : '';
  }

  // Update progress
  updateProgressDisplay();

  // Announce
  const item = electionData.checklist.find((i) => i.id === itemId);
  const itemName = item ? item.title : itemId;
  announce(`${itemName} ${checked ? 'completed' : 'unchecked'}`);

  // Track
  trackChecklistAction(itemId, checked);

  // Save to Firestore
  await saveChecklistProgress(checklistState);
}

/**
 * Updates the progress ring and text display.
 * @private
 */
function updateProgressDisplay() {
  const totalItems = electionData.checklist.length;
  const completedItems = Object.values(checklistState).filter(Boolean).length;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Update progress ring
  const ring = document.getElementById('checklist-progress-ring');
  if (ring) {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;
    ring.style.strokeDashoffset = offset;
  }

  // Update percentage text
  const text = document.getElementById('checklist-progress-text');
  if (text) {
    text.textContent = `${percentage}%`;
  }

  // Update status text
  const status = document.getElementById('checklist-status');
  if (status) {
    if (percentage === 0) {
      status.textContent = 'Getting Started';
    } else if (percentage < 50) {
      status.textContent = 'Making Progress';
    } else if (percentage < 100) {
      status.textContent = 'Almost There!';
    } else {
      status.textContent = '🎉 Election Ready!';
    }
  }

  // Update items count
  const countEl = document.getElementById('checklist-items-count');
  if (countEl) {
    countEl.textContent = `${completedItems} of ${totalItems} steps completed`;
  }
}

/**
 * Loads saved checklist progress from Firestore.
 * @private
 */
async function loadProgress() {
  // Try loading from Firestore first
  const savedProgress = await getChecklistProgress();
  if (Object.keys(savedProgress).length > 0) {
    checklistState = savedProgress;
  } else {
    // Try localStorage as fallback
    try {
      const local = localStorage.getItem('checklist_progress');
      if (local) {
        checklistState = JSON.parse(local);
      }
    } catch (error) {
      console.error('[Checklist] Failed to parse localStorage progress:', error.message);
      checklistState = {};
    }
  }

  // Re-render with loaded state
  renderChecklistItems();
  updateProgressDisplay();
}

/**
 * Sets up the age eligibility calculator.
 * @private
 */
function setupAgeCalculator() {
  const checkBtn = document.getElementById('check-age-btn');
  const dobInput = document.getElementById('dob-input');

  if (checkBtn && dobInput) {
    checkBtn.addEventListener('click', () => {
      calculateAge(dobInput.value);
    });

    dobInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        calculateAge(dobInput.value);
      }
    });
  }
}

/**
 * Calculates age from date of birth and checks voting eligibility.
 *
 * @param {string} dobString - Date of birth in YYYY-MM-DD format.
 */
export function calculateAge(dobString) {
  const resultEl = document.getElementById('age-result');
  if (!resultEl) {
    return;
  }

  if (!dobString) {
    resultEl.textContent = 'Please enter your date of birth.';
    resultEl.className = 'age-result';
    return;
  }

  const dob = new Date(dobString);
  const today = new Date();

  if (isNaN(dob.getTime()) || dob > today) {
    resultEl.textContent = 'Please enter a valid date of birth.';
    resultEl.className = 'age-result';
    return;
  }

  // Calculate age
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age >= 18) {
    resultEl.textContent = `✅ You are ${age} years old. You are eligible to vote! Make sure you're registered on the electoral roll.`;
    resultEl.className = 'age-result eligible';
    announce(`You are ${age} years old and eligible to vote.`);
  } else {
    const yearsUntil = 18 - age;
    resultEl.textContent = `❌ You are ${age} years old. You will be eligible to vote in approximately ${yearsUntil} year${yearsUntil > 1 ? 's' : ''}.`;
    resultEl.className = 'age-result not-eligible';
    announce(`You are ${age} years old. You will be eligible in ${yearsUntil} year${yearsUntil > 1 ? 's' : ''}.`);
  }
}

/**
 * Returns the current checklist state for testing.
 * @returns {Object} Current checklist completion state.
 */
export function getChecklistState() {
  return { ...checklistState };
}

/**
 * Sets checklist state (used for testing).
 * @param {Object<string, boolean>} state
 */
export function setChecklistState(state) {
  checklistState = { ...state };
}
