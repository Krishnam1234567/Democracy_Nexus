import { announce, moveFocus, prefersReducedMotion, createFocusTrap } from '../../src/js/accessibility';

describe('Accessibility Module', () => {
  describe('announce', () => {
    it('creates announcer element if not exists', () => {
      document.body.innerHTML = '';
      announce('Test message');
      const announcer = document.getElementById('aria-announcer');
      expect(announcer).not.toBeNull();
    });

    it('updates existing announcer with message', () => {
      // requestAnimationFrame in jsdom doesn't run automatically;
      // mock it to execute the callback synchronously
      const originalRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = (cb) => cb();
      document.body.innerHTML = '<div id="aria-announcer" aria-live="polite"></div>';
      announce('Test message');
      const announcer = document.getElementById('aria-announcer');
      expect(announcer.textContent).toBe('Test message');
      window.requestAnimationFrame = originalRaf;
    });

    it('respects priority parameter', () => {
      document.body.innerHTML = '';
      announce('Assertive message', 'assertive');
      const announcer = document.getElementById('aria-announcer');
      expect(announcer.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('moveFocus', () => {
    it('moves focus to element by selector', () => {
      document.body.innerHTML = '<button id="target">Target</button>';
      moveFocus('#target');
      expect(document.activeElement.id).toBe('target');
    });

    it('moves focus to HTMLElement directly', () => {
      document.body.innerHTML = '<button id="target">Target</button>';
      const target = document.getElementById('target');
      moveFocus(target);
      expect(document.activeElement.id).toBe('target');
    });

    it('does nothing for non-existent element', () => {
      document.body.innerHTML = '';
      expect(() => moveFocus('#nonexistent')).not.toThrow();
    });
  });

  describe('prefersReducedMotion', () => {
    it('returns boolean', () => {
      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('createFocusTrap', () => {
    it('creates focus trap object with activate/deactivate', () => {
      document.body.innerHTML = '<div><button>Button</button></div>';
      const container = document.querySelector('div');
      const trap = createFocusTrap(container);
      
      expect(typeof trap.activate).toBe('function');
      expect(typeof trap.deactivate).toBe('function');
    });

    it('activates and stores previous focus', () => {
      document.body.innerHTML = '<button id="outside">Outside</button><div id="trap"><button id="inside">Inside</button></div>';
      const trap = createFocusTrap(document.getElementById('trap'));
      document.getElementById('outside').focus();
      trap.activate();
      expect(document.activeElement.id).toBe('inside');
    });

    it('deactivates and restores focus', () => {
      document.body.innerHTML = '<button id="outside">Outside</button><div id="trap"><button id="inside">Inside</button></div>';
      const trap = createFocusTrap(document.getElementById('trap'));
      document.getElementById('outside').focus();
      trap.activate();
      trap.deactivate();
      expect(document.activeElement.id).toBe('outside');
    });
  });
});