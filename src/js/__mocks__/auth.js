/**
 * Manual mock for auth.js.
 * Placed in src/js/__mocks__/ so Jest automatically uses it
 * when any module imports './auth.js'.
 */
export const initAuth = jest.fn().mockReturnValue(true);
export const onAuthChange = jest.fn((cb) => { cb(null); return jest.fn(); });
export const signInWithGoogle = jest.fn().mockResolvedValue(null);
export const signInAnon = jest.fn().mockResolvedValue(null);
export const signOutUser = jest.fn().mockResolvedValue(true);
export const getCurrentUser = jest.fn().mockReturnValue(null);
export const isAuthenticated = jest.fn().mockReturnValue(false);
export const getUserDisplayInfo = jest.fn().mockReturnValue({ name: 'Guest', email: '', photoURL: '', uid: '' });
