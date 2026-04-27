/**
 * Targets security.js line 139: calls.shift() inside remaining() when window expired.
 */
import { createRateLimiter } from '../../src/js/security.js';

describe('security.js — remaining() shift branch (line 139)', () => {
  it('shifts expired calls and returns correct remaining count', async () => {
    const limiter = createRateLimiter(2, 50); // 50ms window
    limiter.tryCall();
    limiter.tryCall();
    expect(limiter.remaining()).toBe(0);
    // Wait for window to expire
    await new Promise(r => setTimeout(r, 60));
    // remaining() now shifts expired calls — hits line 139
    expect(limiter.remaining()).toBe(2);
  });
});
