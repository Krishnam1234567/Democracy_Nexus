import { calculateAge, getChecklistState, setChecklistState } from '../../src/js/checklist';

describe('Checklist Module', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="age-result"></div>';
    setChecklistState({});
  });

  describe('calculateAge', () => {
    it('returns error for empty input', () => {
      calculateAge('');
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('Please enter');
    });

    it('returns error for future date', () => {
      const futureDate = '2099-01-01';
      calculateAge(futureDate);
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('valid date');
    });

    it('returns eligible for age >= 18', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 25);
      calculateAge(dob.toISOString().split('T')[0]);
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('eligible');
    });

    it('returns not eligible for age < 18', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 10);
      calculateAge(dob.toISOString().split('T')[0]);
      const result = document.getElementById('age-result');
      expect(result.textContent).toContain('will be eligible');
    });
  });

  describe('getChecklistState', () => {
    it('returns object', () => {
      const state = getChecklistState();
      expect(typeof state).toBe('object');
    });
  });

  describe('setChecklistState', () => {
    it('sets checklist state', () => {
      setChecklistState({ item1: true, item2: false });
      const state = getChecklistState();
      expect(state.item1).toBe(true);
      expect(state.item2).toBe(false);
    });
  });
});