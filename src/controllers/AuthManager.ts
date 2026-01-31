/**
 * AuthManager Controller
 * Manages authentication UI, state, and user sessions
 */

import { authService } from '../services/authService';
import { animationService } from '../services/animationService';
import { createLoginForm } from '../components/auth/LoginForm';
import { createSignUpForm } from '../components/auth/SignUpForm';
import { createUserProfile } from '../components/auth/UserProfile';
import {
    applications,
    setApplications,
    setFilteredApplications
} from '../stores/applicationStore';
import { CacheManager } from '../utils/cache';
import { generateDemoData } from '../utils/demoData';
import { showSuccessMessage, showInfoMessage } from '../utils/domHelpers';
import type { User } from '../types';

export class AuthManager {
    private currentAuthView: 'login' | 'signup' = 'login';
    private authContainer: HTMLElement | null = null;
    private onUserChange?: (user: User | null) => void;
    private onGuestMode?: () => void;

    constructor(callbacks?: {
        onUserChange?: (user: User | null) => void,
        onGuestMode?: () => void
    }) {
        this.onUserChange = callbacks?.onUserChange;
        this.onGuestMode = callbacks?.onGuestMode;
    }

    /**
     * Initialize AuthManager
     */
    public init(): void {
        const header = document.querySelector('header');
        if (!header) return;

        // Create auth container
        this.authContainer = document.createElement('div');
        this.authContainer.id = 'auth-container';
        this.authContainer.className = 'auth-container';

        // Add to header
        header.appendChild(this.authContainer);

        // Initial render
        this.updateUI();

        // Listen for auth state changes
        authService.onAuthStateChanged(user => {
            this.handleAuthStateChange(user);
        });
    }

    /**
     * Handle auth state change
     */
    private handleAuthStateChange(user: User | null): void {
        if (user) {
            console.log('✅ User authenticated:', user.email);
        } else {
            console.log('👤 User not authenticated');
            // Clear applications but show empty state (handled by callback usually)
            setApplications([]);
            setFilteredApplications([]);
        }

        // Update UI
        this.updateUI();

        // Notify listeners
        if (this.onUserChange) {
            this.onUserChange(user);
        }
    }

    /**
     * Update auth UI based on current state
     */
    public updateUI(): void {
        if (!this.authContainer) return;

        const user = authService.getCurrentUser();

        if (user) {
            // User is authenticated - show profile
            this.authContainer.innerHTML = '';
            this.authContainer.classList.remove('is-modal'); // Switch to inline mode
            const profile = createUserProfile(user, {
                onSignOut: () => {
                    this.handleSignOut();
                },
            });
            this.authContainer.appendChild(profile);
            animationService.animateCardEntrance([profile]);
        } else {
            // User is not authenticated - show login/signup
            this.authContainer.innerHTML = '';
            this.authContainer.classList.add('is-modal'); // Switch to modal mode
            const authForm =
                this.currentAuthView === 'login'
                    ? createLoginForm({
                        onSuccess: () => {
                            // Auth state change will update UI automatically
                        },
                        onSwitchToSignUp: () => {
                            this.currentAuthView = 'signup';
                            this.updateUI();
                        },
                        onContinueAsGuest: () => {
                            this.handleGuestMode();
                        },
                    })
                    : createSignUpForm({
                        onSuccess: () => {
                            // Auth state change will update UI automatically
                        },
                        onSwitchToLogin: () => {
                            this.currentAuthView = 'login';
                            this.updateUI();
                        },
                    });

            this.authContainer.appendChild(authForm);
            animationService.animateCardEntrance([authForm]);
        }
    }

    /**
     * Handle sign out
     */
    private async handleSignOut(): Promise<void> {
        try {
            await authService.signOut();
            // Auth state change listener handles the rest
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    }

    /**
     * Handle Guest mode logic
     */
    private handleGuestMode(): void {
        console.log('👤 Continuing as Guest');

        // Generate demo data if empty
        const currentApps = applications.get();
        if (currentApps.length === 0) {
            const demoApps = generateDemoData(100);
            setApplications(demoApps);
            CacheManager.save(demoApps);
            console.log('🎉 Demo data generated');
            showSuccessMessage('Demo data loaded! You are in Guest Mode.');
        } else {
            showInfoMessage('Welcome back! You are in Guest Mode.');
        }

        // Hide Auth UI and switch to Guest Header
        if (this.authContainer) {
            this.authContainer.innerHTML = '';
            this.authContainer.classList.remove('is-modal'); // Remove modal overlay

            // Render Guest Header with Exit button
            const guestHeader = document.createElement('div');
            guestHeader.style.display = 'flex';
            guestHeader.style.gap = '1rem';
            guestHeader.style.alignItems = 'center';

            guestHeader.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 9999px; border: 1px solid #e2e8f0;">
          <span style="font-size: 1.2rem;">👤</span>
          <span style="font-size: 0.875rem; font-weight: 600; color: #475569;">Guest Mode</span>
        </div>
        <button id="exit-guest-btn" style="background: none; border: none; color: #dc2626; font-weight: 600; font-size: 0.875rem; cursor: pointer; padding: 0.5rem; transition: opacity 0.2s;">
          Exit
        </button>
      `;

            this.authContainer.appendChild(guestHeader);

            // Add Exit Listener
            document.getElementById('exit-guest-btn')?.addEventListener('click', () => {
                window.location.reload();
            });
        }

        // Notify guest mode
        if (this.onGuestMode) {
            this.onGuestMode();
        }

        // Notify guest mode (null user)
        if (this.onUserChange) {
            this.onUserChange(null);
        }
    }
}
