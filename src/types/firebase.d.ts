/**
 * Firebase Type Declarations
 * For Firebase 9.0.0 compat mode
 */

declare namespace firebase {
  function initializeApp(config: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  }): App;

  interface App {
    database(): database.Database;
  }

  namespace database {
    interface Database {
      ref(path?: string): Reference;
    }

    interface Reference {
      key: string | null;
      push(): Reference;
      set(value: unknown): Promise<void>;
      update(value: unknown): Promise<void>;
      remove(): Promise<void>;
      once(event: 'value'): Promise<DataSnapshot>;
      on(event: 'value', callback: (snapshot: DataSnapshot) => void): void;
      off(event: 'value', callback?: (snapshot: DataSnapshot) => void): void;
    }

    interface DataSnapshot {
      val(): unknown;
      key: string | null;
    }
  }
}

declare const firebase: typeof firebase;
