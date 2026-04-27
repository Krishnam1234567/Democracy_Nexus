import { onAuthChange, getUserDisplayInfo, isAuthenticated } from '../../src/js/auth';

describe('Auth Module', () => {
  describe('onAuthChange', () => {
    it('registers callback and returns unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = onAuthChange(callback);
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('calls callback immediately with current state', () => {
      const callback = jest.fn();
      onAuthChange(callback);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('getUserDisplayInfo', () => {
    it('returns object with expected properties', () => {
      const info = getUserDisplayInfo();
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('email');
      expect(info).toHaveProperty('photoURL');
      expect(info).toHaveProperty('uid');
    });

    it('returns Guest for name when no user', () => {
      const info = getUserDisplayInfo();
      expect(info.name).toBe('Guest');
      expect(info.uid).toBe('');
    });
  });

  describe('isAuthenticated', () => {
    it('returns boolean', () => {
      const result = isAuthenticated();
      expect(typeof result).toBe('boolean');
    });
  });
});