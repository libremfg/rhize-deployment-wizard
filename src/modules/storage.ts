import type { WizardSnapshot } from '../types/index.js';

const STORAGE_KEY = 'rhize-wizard-state';
const STORAGE_VERSION = '1.0.0';

export class StorageManager {
  static saveSnapshot(snapshot: WizardSnapshot): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  static loadSnapshot(): WizardSnapshot | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const snapshot = JSON.parse(data) as WizardSnapshot;
      if (snapshot.version !== STORAGE_VERSION) {
        console.warn('Snapshot version mismatch, ignoring saved state');
        return null;
      }
      return snapshot;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return null;
    }
  }

  static clearSnapshot(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  }
}
