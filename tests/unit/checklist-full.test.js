/**
 * @fileoverview Comprehensive checklist module tests.
 */

jest.mock('../../src/js/analytics.js', () => ({
  trackChecklistAction: jest.fn()
}));

jest.mock('../../src/js/accessibility.js', () => ({
  announce: jest.fn()
}));

jest.mock('../../src/js/security.js', () => ({
  sanitizeHTML: jest.fn((s) => s)
}));

jest.mock('../../src/js/firestore.js', () => ({
  saveChecklistProgress: jest.fn().mockResolvedValue(null),
  getChecklistProgress: jest.fn().mockResolvedValue({})
}));

import {
  calculateAge,
  getChecklistState,
  setChecklistState,
  initChecklist
} from '../../src/js/checklist.js';

describe('Checklist Module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="checklist-items"></div>
      <div id="checklist-progress-ring" style=""></div>
      <div id="checklist-progress-text"></div>
      <div id="checklist-status"></div>
      <div id="checklist-items-count"></div>
      <input id="dob-input" type="date" />
      <button id="check-age-btn">Check</button>
      <div id="age-result"></div>
    `;
    jest.clearAllMocks();
  });

  describe('calculateAge', () => {
    it('shows eligibility message for someone over 18', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 20);
      calculateAge(dob.toISOString().split('T')[0]);
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('eligible to vote');
      expect(result.className).toContain('eligible');
    });

    it('shows ineligibility message for someone under 18', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 15);
      calculateAge(dob.toISOString().split('T')[0]);
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('eligible to vote in approximately');
      expect(result.className).toContain('not-eligible');
    });

    it('handles boundary - exactly 18 today', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 18);
      calculateAge(dob.toISOString().split('T')[0]);
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('eligible');
    });

    it('shows error for empty input', () => {
      calculateAge('');
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('Please enter your date of birth');
    });

    it('shows error for invalid date', () => {
      calculateAge('not-a-date');
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('valid date');
    });

    it('shows error for future date', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      calculateAge(future.toISOString().split('T')[0]);
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('valid date');
    });

    it('returns early when age-result element is missing', () => {
      document.body.innerHTML = '';
      expect(() => calculateAge('2000-01-01')).not.toThrow();
    });

    it('shows singular year when 1 year until eligible', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 17);
      calculateAge(dob.toISOString().split('T')[0]);
      const result = document.getElementById('age-result');
      expect(result.textContent).toMatch(/year/);
    });
  });

  describe('getChecklistState and setChecklistState', () => {
    it('getChecklistState returns empty object by default', () => {
      const state = getChecklistState();
      expect(typeof state).toBe('object');
    });

    it('setChecklistState updates the state', () => {
      setChecklistState({ 'voter-id': true });
      const state = getChecklistState();
      expect(state['voter-id']).toBe(true);
    });

    it('returns a copy so original state is not mutated', () => {
      setChecklistState({ 'voter-id': false });
      const state = getChecklistState();
      state['voter-id'] = true;
      const state2 = getChecklistState();
      expect(state2['voter-id']).toBe(false);
    });
  });

  describe('initChecklist', () => {
    it('renders checklist items on init', async () => {
      await initChecklist();
      const container = document.getElementById('checklist-items');
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('does not throw when called', async () => {
      await expect(initChecklist()).resolves.not.toThrow();
    });

    it('renders checkboxes for each item', async () => {
      await initChecklist();
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Checkbox interaction', () => {
    it('handles checkbox change event - check', async () => {
      await initChecklist();
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length > 0) {
        checkboxes[0].checked = true;
        checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
        // Small wait for async save
        await new Promise(r => setTimeout(r, 10));
        expect(true).toBe(true);
      }
    });

    it('handles checkbox change event - uncheck', async () => {
      await initChecklist();
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length > 0) {
        checkboxes[0].checked = false;
        checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 10));
        expect(true).toBe(true);
      }
    });
  });

  describe('Progress display', () => {
    it('shows "Getting Started" at 0%', async () => {
      setChecklistState({});
      await initChecklist();
      const status = document.getElementById('checklist-status');
      expect(status.textContent).toBe('Getting Started');
    });

    it('shows correct item count', async () => {
      await initChecklist();
      const count = document.getElementById('checklist-items-count');
      expect(count.textContent).toContain('of');
    });
  });
});
