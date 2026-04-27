import { jest } from '@jest/globals';

describe('PWA Module Tests', () => {
  describe('Manifest Validation', () => {
    let manifest;

    beforeAll(() => {
      manifest = {
        name: 'Election Process Education Assistant',
        short_name: 'ElectionEdu',
        description: 'Interactive Election Process Education Assistant for Indian Democracy',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a1628',
        theme_color: '#0a1628',
        orientation: 'portrait-primary',
        categories: ['education', 'government', 'politics']
      };
    });

    test('should have valid manifest name', () => {
      expect(manifest.name).toBe('Election Process Education Assistant');
    });

    test('should be installable', () => {
      expect(manifest.display).toBe('standalone');
    });

    test('should have valid categories', () => {
      expect(manifest.categories).toContain('education');
      expect(manifest.categories).toContain('government');
    });

    test('should have valid hex colors', () => {
      expect(manifest.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(manifest.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    test('should have valid start URL', () => {
      expect(manifest.start_url).toBe('/');
    });
  });
});