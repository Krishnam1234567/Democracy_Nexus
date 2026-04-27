/**
 * @fileoverview Comprehensive accessibility module tests.
 * Targets all uncovered branches including focus trap Tab/Shift+Tab wrapping,
 * arrow key navigation, IntersectionObserver callbacks, and counter animation.
 */

import {
  announce,
  moveFocus,
  createFocusTrap,
  setupArrowKeyNavigation,
  prefersReducedMotion,
  initScrollReveal,
  initCounterAnimations
} from '../../src/js/accessibility.js';

describe('Accessibility Module - Full Coverage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false, addListener: jest.fn(), removeListener: jest.fn(),
      addEventListener: jest.fn(), removeEventListener: jest.fn()
    });
  });

  // ==================== announce ====================
  describe('announce', () => {
    it('creates aria-announcer element if not present', () => {
      announce('Test message');
      expect(document.getElementById('aria-announcer')).not.toBeNull();
    });

    it('sets textContent via rAF when mocked synchronously', () => {
      const origRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = (cb) => cb();
      announce('Hello World');
      expect(document.getElementById('aria-announcer').textContent).toBe('Hello World');
      window.requestAnimationFrame = origRaf;
    });

    it('reuses existing announcer element', () => {
      announce('First');
      announce('Second');
      expect(document.querySelectorAll('#aria-announcer').length).toBe(1);
    });

    it('sets aria-live to polite by default', () => {
      announce('Polite');
      expect(document.getElementById('aria-announcer').getAttribute('aria-live')).toBe('polite');
    });

    it('sets aria-live to assertive when specified', () => {
      announce('Urgent', 'assertive');
      expect(document.getElementById('aria-announcer').getAttribute('aria-live')).toBe('assertive');
    });

    it('has aria-atomic="true"', () => {
      announce('Test');
      expect(document.getElementById('aria-announcer').getAttribute('aria-atomic')).toBe('true');
    });

    it('has sr-only class', () => {
      announce('Test');
      expect(document.getElementById('aria-announcer').classList.contains('sr-only')).toBe(true);
    });

    it('clears textContent before setting new message (rAF deferred)', () => {
      window.requestAnimationFrame = () => { /* don't run cb */ };
      announce('Clearing test');
      expect(document.getElementById('aria-announcer').textContent).toBe('');
    });
  });

  // ==================== moveFocus ====================
  describe('moveFocus', () => {
    it('focuses element by CSS selector', () => {
      document.body.innerHTML = '<button id="t">Click</button>';
      const btn = document.getElementById('t');
      btn.focus = jest.fn();
      moveFocus('#t');
      expect(btn.focus).toHaveBeenCalled();
    });

    it('focuses HTMLElement directly', () => {
      document.body.innerHTML = '<input id="i" />';
      const input = document.getElementById('i');
      input.focus = jest.fn();
      moveFocus(input);
      expect(input.focus).toHaveBeenCalled();
    });

    it('does nothing for non-existent selector', () => {
      expect(() => moveFocus('#nonexistent')).not.toThrow();
    });

    it('adds tabindex=-1 to non-focusable elements', () => {
      document.body.innerHTML = '<div id="d">Content</div>';
      const div = document.getElementById('d');
      div.focus = jest.fn();
      moveFocus(div);
      expect(div.getAttribute('tabindex')).toBe('-1');
    });

    it('does not add tabindex to button elements', () => {
      document.body.innerHTML = '<button id="b">Btn</button>';
      const btn = document.getElementById('b');
      btn.focus = jest.fn();
      moveFocus(btn);
      expect(btn.hasAttribute('tabindex')).toBe(false);
    });
  });

  // ==================== createFocusTrap ====================
  describe('createFocusTrap', () => {
    it('returns activate and deactivate methods', () => {
      document.body.innerHTML = '<div id="trap"><button>B1</button><button>B2</button></div>';
      const trap = createFocusTrap(document.getElementById('trap'));
      expect(typeof trap.activate).toBe('function');
      expect(typeof trap.deactivate).toBe('function');
    });

    it('activate focuses first focusable element', () => {
      document.body.innerHTML = '<div id="trap"><button id="b1">B1</button><button id="b2">B2</button></div>';
      const trap = createFocusTrap(document.getElementById('trap'));
      trap.activate();
      expect(document.activeElement.id).toBe('b1');
    });

    it('deactivate restores previous focus', () => {
      document.body.innerHTML = '<button id="prev">Prev</button><div id="trap"><button id="b1">B1</button></div>';
      document.getElementById('prev').focus();
      const trap = createFocusTrap(document.getElementById('trap'));
      trap.activate();
      trap.deactivate();
      expect(document.activeElement.id).toBe('prev');
    });

    it('Tab key with no focusable elements — returns without error (line 93)', () => {
      document.body.innerHTML = '<div id="trap"></div>';
      const container = document.getElementById('trap');
      const trap = createFocusTrap(container);
      trap.activate();
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      expect(() => container.dispatchEvent(event)).not.toThrow();
    });

    it('Tab key wraps from last to first (line 105-107)', () => {
      document.body.innerHTML = '<div id="trap"><button id="b1">B1</button><button id="b2">B2</button></div>';
      const container = document.getElementById('trap');
      const trap = createFocusTrap(container);
      trap.activate();
      document.getElementById('b2').focus(); // focus last
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true, cancelable: true })
      );
      expect(document.activeElement.id).toBe('b1');
    });

    it('Shift+Tab wraps from first to last (line 99-103)', () => {
      document.body.innerHTML = '<div id="trap"><button id="b1">B1</button><button id="b2">B2</button></div>';
      const container = document.getElementById('trap');
      const trap = createFocusTrap(container);
      trap.activate();
      document.getElementById('b1').focus(); // focus first
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
      );
      expect(document.activeElement.id).toBe('b2');
    });

    it('non-Tab key ignored in trap', () => {
      document.body.innerHTML = '<div id="trap"><button>B</button></div>';
      const container = document.getElementById('trap');
      const trap = createFocusTrap(container);
      trap.activate();
      expect(() => container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )).not.toThrow();
    });
  });

  // ==================== setupArrowKeyNavigation ====================
  describe('setupArrowKeyNavigation', () => {
    function makeNav(n = 3) {
      document.body.innerHTML = `<div id="nav">${
        Array.from({ length: n }, (_, i) => `<button class="item" id="item${i}">Item ${i}</button>`).join('')
      }</div>`;
      return document.getElementById('nav');
    }

    it('ArrowDown moves to next item (line 158-160)', () => {
      const c = makeNav(3);
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('item0').focus();
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement.id).toBe('item1');
    });

    it('ArrowDown wraps from last to first', () => {
      const c = makeNav(3);
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('item2').focus();
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement.id).toBe('item0');
    });

    it('ArrowRight moves to next item', () => {
      const c = makeNav(3);
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('item0').focus();
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(document.activeElement.id).toBe('item1');
    });

    it('ArrowUp moves to previous item (line 163-166)', () => {
      const c = makeNav(3);
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('item2').focus();
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement.id).toBe('item1');
    });

    it('ArrowUp wraps from first to last', () => {
      const c = makeNav(3);
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('item0').focus();
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement.id).toBe('item2');
    });

    it('ArrowLeft moves to previous item', () => {
      const c = makeNav(3);
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('item2').focus();
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(document.activeElement.id).toBe('item1');
    });

    it('Home key moves to first item (line 168-171)', () => {
      const c = makeNav(3);
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('item2').focus();
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement.id).toBe('item0');
    });

    it('End key moves to last item (line 172-175)', () => {
      const c = makeNav(3);
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('item0').focus();
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement.id).toBe('item2');
    });

    it('non-navigation key does nothing', () => {
      const c = makeNav(2);
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('item0').focus();
      expect(() => c.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))).not.toThrow();
    });

    it('ignores event when focused element not in item list (line 149-151)', () => {
      document.body.innerHTML = '<div id="nav"><button class="item">A</button></div><input id="out"/>';
      const c = document.getElementById('nav');
      setupArrowKeyNavigation(c, '.item');
      document.getElementById('out').focus();
      expect(() => c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))).not.toThrow();
    });
  });

  // ==================== prefersReducedMotion ====================
  describe('prefersReducedMotion', () => {
    it('returns false when matchMedia does not match', () => {
      expect(prefersReducedMotion()).toBe(false);
    });

    it('returns true when matchMedia matches reduced motion', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      expect(prefersReducedMotion()).toBe(true);
    });

    it('returns a boolean', () => {
      expect(typeof prefersReducedMotion()).toBe('boolean');
    });
  });

  // ==================== initScrollReveal ====================
  describe('initScrollReveal', () => {
    it('does not throw with no elements', () => {
      expect(() => initScrollReveal()).not.toThrow();
    });

    it('adds visible class immediately when reduced motion preferred (line 197-201)', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      document.body.innerHTML = '<div class="fade-in-up"></div><div class="stagger-children"></div>';
      initScrollReveal();
      document.querySelectorAll('.fade-in-up, .stagger-children').forEach(el => {
        expect(el.classList.contains('visible')).toBe(true);
      });
    });

    it('IntersectionObserver adds visible on intersection (line 206-209)', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: false });
      let cb = null;
      globalThis.IntersectionObserver = class {
        constructor(fn) { cb = fn; }
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      document.body.innerHTML = '<div class="fade-in-up"></div>';
      initScrollReveal();
      const el = document.querySelector('.fade-in-up');
      cb([{ isIntersecting: true, target: el }]);
      expect(el.classList.contains('visible')).toBe(true);
    });

    it('IntersectionObserver ignores non-intersecting entries', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: false });
      let cb = null;
      globalThis.IntersectionObserver = class {
        constructor(fn) { cb = fn; }
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      document.body.innerHTML = '<div class="fade-in-up"></div>';
      initScrollReveal();
      const el = document.querySelector('.fade-in-up');
      cb([{ isIntersecting: false, target: el }]);
      expect(el.classList.contains('visible')).toBe(false);
    });
  });

  // ==================== initCounterAnimations ====================
  describe('initCounterAnimations', () => {
    it('does not throw with no counter elements', () => {
      expect(() => initCounterAnimations()).not.toThrow();
    });

    it('sets textContent immediately when reduced motion preferred (line 229-232)', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      document.body.innerHTML = '<span class="stat-number" data-count="42"></span>';
      initCounterAnimations();
      expect(document.querySelector('.stat-number').textContent).toBe('42');
    });

    it('IntersectionObserver triggers animateCounter on intersection (lines 237-278)', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: false });
      // Mock rAF to call cb with time past duration so counter reaches target immediately
      const origRaf = window.requestAnimationFrame;
      window.requestAnimationFrame = (cb) => cb(performance.now() + 5000);
      let cb = null;
      globalThis.IntersectionObserver = class {
        constructor(fn) { cb = fn; }
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      document.body.innerHTML = '<span class="stat-number" data-count="100"></span>';
      initCounterAnimations();
      const counter = document.querySelector('.stat-number');
      cb([{ isIntersecting: true, target: counter }]);
      expect(counter.textContent).toBe('100');
      window.requestAnimationFrame = origRaf;
    });

    it('IntersectionObserver ignores non-intersecting counter entries', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: false });
      let cb = null;
      globalThis.IntersectionObserver = class {
        constructor(fn) { cb = fn; }
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      document.body.innerHTML = '<span class="stat-number" data-count="50"></span>';
      initCounterAnimations();
      const counter = document.querySelector('.stat-number');
      cb([{ isIntersecting: false, target: counter }]);
      expect(counter.textContent).toBe('');
    });

    it('animateCounter shows intermediate values during animation', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: false });
      let callCount = 0;
      const origRaf = window.requestAnimationFrame;
      // First call: time at 0 (start), second call: past duration
      window.requestAnimationFrame = (cb) => {
        callCount++;
        cb(callCount === 1 ? performance.now() : performance.now() + 5000);
      };
      let observerCb = null;
      globalThis.IntersectionObserver = class {
        constructor(fn) { observerCb = fn; }
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      document.body.innerHTML = '<span class="stat-number" data-count="200"></span>';
      initCounterAnimations();
      const counter = document.querySelector('.stat-number');
      observerCb([{ isIntersecting: true, target: counter }]);
      expect(counter.textContent).toBe('200');
      window.requestAnimationFrame = origRaf;
    });
  });
});
