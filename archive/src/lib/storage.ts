/**
 * LocalStorage-Utilities mit TypeScript-Support
 */

const STORAGE_PREFIX = 'pflegenavigator_';

/**
 * Speichert Daten im LocalStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, serialized);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Liest Daten aus dem LocalStorage
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const serialized = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (serialized === null) return defaultValue;
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Entfernt Daten aus dem LocalStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

/**
 * Loescht alle PflegeNavigator-Daten
 */
export function clearAllStorage(): void {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

/**
 * Prueft, ob LocalStorage verfuegbar ist
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Spezifische Storage-Funktionen

export const storage = {
  // Formulardaten
  forms: {
    saveFormProgress: (formId: string, data: unknown) => {
      setStorageItem(`form_${formId}`, {
        data,
        timestamp: Date.now()
      });
    },
    
    getFormProgress: (formId: string) => {
      return getStorageItem(`form_${formId}`, null);
    },
    
    clearFormProgress: (formId: string) => {
      removeStorageItem(`form_${formId}`);
    }
  },

  // Benutzereinstellungen
  settings: {
    saveLanguage: (lang: string) => {
      setStorageItem('language', lang);
    },
    
    getLanguage: () => {
      return getStorageItem('language', 'de');
    },
    
    saveAccessibilitySettings: (settings: {
      reducedMotion?: boolean;
      highContrast?: boolean;
      largeText?: boolean;
    }) => {
      setStorageItem('accessibility', settings);
    },
    
    getAccessibilitySettings: () => {
      return getStorageItem('accessibility', {
        reducedMotion: false,
        highContrast: false,
        largeText: false
      });
    }
  },

  // Session-Daten
  session: {
    markTourAsSeen: () => {
      setStorageItem('tour_seen', true);
    },
    
    hasSeenTour: () => {
      return getStorageItem('tour_seen', false);
    },
    
    saveLastVisited: (page: string) => {
      setStorageItem('last_visited', {
        page,
        timestamp: Date.now()
      });
    },
    
    getLastVisited: () => {
      return getStorageItem('last_visited', null);
    }
  },

  // Tagebucheintraege
  diary: {
    saveEntry: (entry: { date: string; text: string; id: number }) => {
      const entries = getStorageItem('diary_entries', [] as typeof entry[]);
      entries.push(entry);
      setStorageItem('diary_entries', entries);
    },
    
    getEntries: () => {
      return getStorageItem('diary_entries', [] as { date: string; text: string; id: number }[]);
    },
    
    deleteEntry: (id: number) => {
      const entries = getStorageItem('diary_entries', [] as { date: string; text: string; id: number }[]);
      const filtered = entries.filter(e => e.id !== id);
      setStorageItem('diary_entries', filtered);
    }
  },

  // Feedback
  feedback: {
    saveFeedback: (feedback: unknown) => {
      const feedbacks = getStorageItem('feedback', [] as unknown[]);
      feedbacks.push(feedback);
      setStorageItem('feedback', feedbacks);
    },
    
    getFeedback: () => {
      return getStorageItem('feedback', [] as unknown[]);
    }
  }
};
