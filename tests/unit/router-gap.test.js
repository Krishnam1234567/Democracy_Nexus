/**
 * Targets router.js uncovered lines:
 *  - line 83: newSection.hasAttribute('hidden') → removeAttribute branch
 *  - line 130: animationend callback removes page-enter class
 */

jest.mock('../../src/js/accessibility.js', () => ({
  announce: jest.fn(),
  moveFocus: jest.fn()
}));

jest.mock('../../src/js/analytics.js', () => ({
  trackPageView: jest.fn()
}));

import { navigateTo, getCurrentPage } from '../../src/js/router.js';

function setupDOM() {
  document.body.innerHTML = `
    <main id="main-content" tabindex="-1"></main>
    <section id="page-home" class="active"></section>
    <section id="page-timeline" hidden></section>
    <section id="page-quiz" hidden></section>
    <section id="page-glossary" hidden></section>
    <section id="page-checklist" hidden></section>
    <nav>
      <a class="nav-link" data-page="home" href="#home">Home</a>
      <a class="nav-link" data-page="timeline" href="#timeline">Timeline</a>
      <a class="nav-link" data-page="quiz" href="#quiz">Quiz</a>
      <a class="nav-link" data-page="glossary" href="#glossary">Glossary</a>
      <a class="nav-link" data-page="checklist" href="#checklist">Checklist</a>
    </nav>
  `;
}

describe('router.js — uncovered branches', () => {
  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
    jest.useFakeTimers();
    navigateTo('checklist'); // reset state
    jest.clearAllMocks();
    setupDOM();
  });

  afterEach(() => jest.useRealTimers());

  it('line 83: removes hidden attribute when newSection has it (page already has hidden attr)', () => {
    // page-timeline has hidden attribute in our setupDOM — navigating to it hits line 82-83
    navigateTo('timeline');
    const timelinePage = document.getElementById('page-timeline');
    expect(timelinePage.hasAttribute('hidden')).toBe(false);
  });

  it('line 130: animationend removes page-enter class', () => {
    navigateTo('quiz');
    const quizPage = document.getElementById('page-quiz');
    expect(quizPage.classList.contains('page-enter')).toBe(true);
    // Fire the animationend event to trigger line 130
    quizPage.dispatchEvent(new Event('animationend'));
    expect(quizPage.classList.contains('page-enter')).toBe(false);
  });
});
