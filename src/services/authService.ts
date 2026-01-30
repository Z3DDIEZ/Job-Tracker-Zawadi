/**
 * Authentication Service
 * Handles Firebase Authentication operations
 *
 * Features:
 * - Email/Password authentication
 * - User session management
 * - Auth state monitoring
 * - Secure sign out
 */

import type { User, AuthError, AuthStateChangeCallback } from '@/types';

class AuthService {
  private auth: firebase.auth.Auth | null = null;
  private authStateListeners: Set<AuthStateChangeCallback> = new Set();
  private currentUser: User | null = null;

  /**
   * Initialize Firebase Authentication
   */
  initialize(auth: firebase.auth.Auth): void {
    this.auth = auth;

    // Listen for auth state changes
    auth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        this.currentUser = this.mapFirebaseUser(firebaseUser);
      } else {
        this.currentUser = null;
      }

      // Notify all listeners
      this.authStateListeners.forEach(callback => {
        callback(this.currentUser);
      });
    });
  }

  /**
   * Check if auth is initialized
   */
  private ensureInitialized(): void {
    if (!this.auth) {
      throw new Error('AuthService not initialized. Call initialize() first.');
    }
  }

  /**
   * Map Firebase User to our User type
   */
  private mapFirebaseUser(firebaseUser: firebase.auth.User): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      emailVerified: firebaseUser.emailVerified,
    };
  }

  /**
   * Map Firebase AuthError to our AuthError type
   */
  private mapAuthError(error: firebase.auth.Error): AuthError {
    // Map common error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed':
        'Email/password authentication is not enabled. Please contact support.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-login-credentials':
        'Invalid email or password. Please check your credentials and try again.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed':
        'Network error. Please check your internet connection and try again.',
      'auth/internal-error': 'An internal error occurred. Please try again later.',
      'auth/invalid-api-key': 'Invalid API key. Please check your Firebase configuration.',
      'auth/app-deleted': 'Firebase app has been deleted. Please contact support.',
      'auth/app-not-authorized': 'Firebase app is not authorized. Please check your configuration.',
      'auth/configuration-not-found': 'Firebase configuration not found. Please check your setup.',
      'auth/no-current-user': 'No user is currently signed in.',
      'auth/user-already-verified': 'Your email is already verified.',
      'auth/user-token-expired': 'Your session has expired. Please sign in again.',
      'auth/invalid-user-token': 'Invalid session. Please sign in again.',
    };

    // Log the error code for debugging
    if (!errorMessages[error.code]) {
      console.error('Unhandled auth error code:', error.code, error);
    }

    return {
      code: error.code,
      message:
        errorMessages[error.code] ||
        error.message ||
        'An authentication error occurred. Please try again.',
    };
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<User> {
    this.ensureInitialized();

    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw { code: 'auth/invalid-email', message: 'Please enter a valid email address.' };
      }

      // Validate password strength
      if (password.length < 6) {
        throw { code: 'auth/weak-password', message: 'Password must be at least 6 characters.' };
      }

      const userCredential = await this.auth!.createUserWithEmailAndPassword(email, password);

      if (!userCredential.user) {
        throw new Error('Failed to create user account.');
      }

      // Send email verification (don't fail signup if this fails)
      try {
        await userCredential.user.sendEmailVerification();
      } catch (verificationError) {
        // Log but don't throw - user is still created successfully
        console.warn('Failed to send verification email:', verificationError);
      }

      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      // Log the actual error for debugging
      console.error('Sign up error:', error);

      // Handle different error types
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as firebase.auth.Error;
        throw this.mapAuthError(authError);
      } else if (error instanceof Error) {
        // Handle regular Error objects
        throw {
          code: 'auth/unknown-error',
          message: error.message || 'An error occurred during sign up. Please try again.',
        };
      } else {
        // Handle unknown error types
        throw {
          code: 'auth/unknown-error',
          message: 'An unexpected error occurred. Please check your connection and try again.',
        };
      }
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    this.ensureInitialized();

    try {
      const userCredential = await this.auth!.signInWithEmailAndPassword(email, password);

      if (!userCredential.user) {
        throw new Error('Failed to sign in.');
      }

      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      const authError = error as firebase.auth.Error;
      throw this.mapAuthError(authError);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    this.ensureInitialized();

    try {
      await this.auth!.signOut();
      this.currentUser = null;
    } catch (error) {
      const authError = error as firebase.auth.Error;
      throw this.mapAuthError(authError);
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: AuthStateChangeCallback): () => void {
    this.authStateListeners.add(callback);

    // Immediately call with current user
    if (this.currentUser) {
      callback(this.currentUser);
    }

    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    this.ensureInitialized();

    try {
      if (!this.isValidEmail(email)) {
        throw { code: 'auth/invalid-email', message: 'Please enter a valid email address.' };
      }

      await this.auth!.sendPasswordResetEmail(email);
    } catch (error) {
      const authError = error as firebase.auth.Error;
      throw this.mapAuthError(authError);
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    this.ensureInitialized();

    const firebaseUser = this.auth!.currentUser;
    if (!firebaseUser) {
      throw { code: 'auth/no-current-user', message: 'No user is currently signed in.' };
    }

    // Check if user is already verified
    if (firebaseUser.emailVerified) {
      throw { code: 'auth/user-already-verified', message: 'Your email is already verified.' };
    }

    try {
      // Reload user data to get latest verification status
      await (firebaseUser as any).reload();

      // Get fresh user reference after reload
      const reloadedUser = this.auth!.currentUser;

      if (!reloadedUser) {
        throw {
          code: 'auth/user-not-found',
          message: 'User session expired. Please sign in again.',
        };
      }

      if (reloadedUser.emailVerified) {
        throw { code: 'auth/user-already-verified', message: 'Your email is already verified.' };
      }

      // Send verification email
      await (reloadedUser as any).sendEmailVerification();

      console.log('✅ Email verification sent successfully to:', reloadedUser.email);
    } catch (error) {
      console.error('❌ Email verification error:', error);

      // Handle specific Firebase errors
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as firebase.auth.Error;

        // Map additional email verification specific errors
        const verificationErrorMessages: Record<string, string> = {
          'auth/too-many-requests':
            'Too many verification emails sent recently. Please wait a few minutes before trying again.',
          'auth/user-token-expired': 'Your session has expired. Please sign in again.',
          'auth/user-disabled': 'Your account has been disabled. Please contact support.',
          'auth/invalid-user-token': 'Invalid session. Please sign in again.',
          'auth/operation-not-allowed': 'Email verification is not enabled for this project.',
        };

        if (verificationErrorMessages[authError.code]) {
          throw {
            code: authError.code,
            message: verificationErrorMessages[authError.code],
          };
        }

        throw this.mapAuthError(authError);
      }

      // Handle network or other errors
      if (error instanceof Error) {
        throw {
          code: 'auth/network-error',
          message: 'Network error. Please check your connection and try again.',
        };
      }

      throw {
        code: 'auth/unknown-error',
        message: 'Failed to send verification email. Please try again later.',
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    this.ensureInitialized();

    const user = this.auth!.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in.');
    }

    try {
      if (newPassword.length < 6) {
        throw { code: 'auth/weak-password', message: 'Password must be at least 6 characters.' };
      }

      await user.updatePassword(newPassword);
    } catch (error) {
      const authError = error as firebase.auth.Error;
      throw this.mapAuthError(authError);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
