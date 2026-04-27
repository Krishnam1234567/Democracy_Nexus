/**
 * @fileoverview Interactive Election Timeline component.
 * Renders and manages the step-by-step election process timeline.
 * @module timeline
 */

import electionData from '../data/election-data.json';
import { sanitizeHTML } from './security.js';
import { announce } from './accessibility.js';
import { trackTimelineView } from './analytics.js';

/** @type {string} Currently selected election type */
let currentType = 'general';

/** @type {number|null} Currently expanded timeline item index */
let expandedItem = null;

/**
 * Initializes the timeline component.
 * Sets up tab navigation and renders the default timeline.
 */
export function initTimeline() {
  setupTabNavigation();
  renderTimeline(currentType);
  renderSummary();
}

/**
 * Sets up click handlers for the timeline type selector tabs.
 * @private
 */
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.timeline-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const type = tab.getAttribute('data-type');
      if (type === currentType) {
        return;
      }

      // Update active tab
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      currentType = type;
      expandedItem = null;
      renderTimeline(type);
      renderSummary();

      announce(`Showing ${type} election timeline`);
      trackTimelineView(type, 'overview');
    });
  });
}

/**
 * Renders the timeline for a given election type.
 *
 * @param {string} type - The election type ('general', 'state', 'local').
 */
export function renderTimeline(type) {
  const container = document.getElementById('timeline-container');
  if (!container) {
    console.error('[Timeline] Container not found');
    return;
  }

  const phases = electionData.timeline[type];
  if (!phases) {
    console.error('[Timeline] No data for type:', type);
    container.innerHTML = '<p>Timeline data not available.</p>';
    return;
  }

  container.innerHTML = phases.map((phase, index) => createTimelineItem(phase, index)).join('');

  // Immediately show all items (IntersectionObserver doesn't catch dynamically added elements)
  requestAnimationFrame(() => {
    const items = container.querySelectorAll('.fade-in-up');
    console.log('[Timeline] Rendered', items.length, 'items for', type);
    items.forEach((el) => {
      el.classList.add('visible');
    });
  });

  // Attach click handlers for expanding/collapsing details
  container.querySelectorAll('.timeline-card').forEach((card, index) => {
    card.addEventListener('click', () => toggleDetails(index, type));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDetails(index, type);
      }
    });
  });
}

/**
 * Creates the HTML for a single timeline item.
 *
 * @param {Object} phase - The timeline phase data.
 * @param {number} index - The item index.
 * @returns {string} HTML string for the timeline item.
 * @private
 */
function createTimelineItem(phase, index) {
  const detailsList = phase.details
    ? phase.details.map((detail) => `<li>${sanitizeHTML(detail)}</li>`).join('')
    : '';

  return `
    <div class="timeline-item fade-in-up" role="listitem" data-index="${index}" id="timeline-item-${phase.id}">
      <div class="timeline-marker" aria-hidden="true">${phase.step}</div>
      <div class="timeline-card" tabindex="0" role="button" aria-expanded="false" aria-controls="details-${phase.id}" aria-label="Step ${phase.step}: ${phase.title}. Click to expand details.">
        <span class="timeline-phase">${sanitizeHTML(phase.phase)}</span>
        <h3>${sanitizeHTML(phase.title)}</h3>
        <p>${sanitizeHTML(phase.description)}</p>
        <span class="timeline-duration" aria-label="Duration: ${phase.duration}">
          ⏱️ ${sanitizeHTML(phase.duration)}
        </span>
        ${detailsList ? `
          <div class="timeline-details" id="details-${phase.id}" role="region" aria-label="Details for ${phase.title}">
            <ul>${detailsList}</ul>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Toggles the expanded/collapsed state of a timeline item's details.
 *
 * @param {number} index - The index of the item to toggle.
 * @param {string} type - The current election type.
 * @private
 */
function toggleDetails(index, type) {
  const container = document.getElementById('timeline-container');
  const items = container.querySelectorAll('.timeline-item');
  const targetItem = items[index];
  if (!targetItem) {
    return;
  }

  const card = targetItem.querySelector('.timeline-card');
  const details = targetItem.querySelector('.timeline-details');

  if (!details) {
    return;
  }

  const isExpanded = details.classList.contains('open');

  // Close all details first
  container.querySelectorAll('.timeline-details').forEach((d) => d.classList.remove('open'));
  container.querySelectorAll('.timeline-card').forEach((c) => c.setAttribute('aria-expanded', 'false'));
  container.querySelectorAll('.timeline-item').forEach((i) => i.classList.remove('active'));

  if (!isExpanded) {
    details.classList.add('open');
    card.setAttribute('aria-expanded', 'true');
    targetItem.classList.add('active');
    expandedItem = index;

    const phase = electionData.timeline[type][index];
    announce(`Expanded details for step ${index + 1}: ${phase.title}`);
    trackTimelineView(type, phase.title);
  } else {
    expandedItem = null;
    announce('Details collapsed');
  }
}

/**
 * Renders the summary section below the timeline.
 * @private
 */
function renderSummary() {
  const grid = document.getElementById('summary-grid');
  if (!grid) {
    return;
  }

  const phases = electionData.timeline[currentType];
  const totalSteps = phases.length;
  const preElection = phases.filter((p) => p.phase === 'Pre-Election').length;
  const nomination = phases.filter((p) => p.phase === 'Nomination').length;
  const campaign = phases.filter((p) => p.phase === 'Campaign').length;
  const polling = phases.filter((p) => p.phase === 'Polling').length;
  const postElection = phases.filter((p) => p.phase === 'Post-Election').length;

  const summaryItems = [
    { number: totalSteps, label: 'Total Steps' },
    { number: preElection, label: 'Pre-Election' },
    { number: nomination, label: 'Nomination' },
    { number: campaign, label: 'Campaign' },
    { number: polling + postElection, label: 'Poll & Results' }
  ];

  grid.innerHTML = summaryItems.map((item) => `
    <div class="summary-item">
      <span class="summary-number">${item.number}</span>
      <span class="summary-label">${item.label}</span>
    </div>
  `).join('');
}

/**
 * Returns the current timeline type and expanded item for state persistence.
 * @returns {Object} Current timeline state.
 */
export function getTimelineState() {
  return { type: currentType, expandedItem };
}
