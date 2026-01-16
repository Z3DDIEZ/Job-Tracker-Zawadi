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
    auth(): auth.Auth;
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

  namespace auth {
    interface Auth {
      currentUser: User | null;
      onAuthStateChanged(
        nextOrObserver: (user: User | null) => void,
        error?: (error: Error) => void,
        completed?: () => void
      ): () => void;
      createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential>;
      signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential>;
      signOut(): Promise<void>;
      sendPasswordResetEmail(email: string): Promise<void>;
    }

    interface User {
      uid: string;
      email: string | null;
      displayName: string | null;
      emailVerified: boolean;
      sendEmailVerification(): Promise<void>;
      updatePassword(newPassword: string): Promise<void>;
    }

    interface UserCredential {
      user: User;
    }

    interface Error {
      code: string;
      message: string;
    }
  }
}

declare const firebase: typeof firebase;
