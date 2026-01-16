/**
 * User Profile Component
 * Displays user information and auth controls
 */

import { authService } from '@/services/authService';
import { animationService } from '@/services/animationService';
import type { User } from '@/types';

export interface UserProfileOptions {
  onSignOut?: () => void;
}

/**
 * Create user profile dropdown component
 */
export function createUserProfile(user: User, options: UserProfileOptions = {}): HTMLElement {
  const profile = document.createElement('div');
  profile.className = 'user-profile';
  profile.innerHTML = `
    <button class="user-profile-trigger" id="user-profile-trigger" aria-label="User menu">
      <span class="user-avatar">${getInitials(user.email || 'User')}</span>
      <span class="user-email">${user.email || 'User'}</span>
      <svg class="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="user-profile-menu" id="user-profile-menu" style="display: none;">
      <div class="user-profile-header">
        <div class="user-avatar-large">${getInitials(user.email || 'User')}</div>
        <div class="user-info">
          <div class="user-email-display">${user.email || 'User'}</div>
          ${user.emailVerified ? 
            '<span class="email-verified-badge">✓ Verified</span>' : 
            '<span class="email-unverified-badge">⚠ Not verified</span>'
          }
        </div>
      </div>
      <div class="user-profile-actions">
        ${!user.emailVerified ? `
          <button class="menu-item" id="resend-verification-btn">
            Resend verification email
          </button>
        ` : ''}
        <button class="menu-item" id="sign-out-btn">
          Sign Out
        </button>
      </div>
    </div>
  `;

  const trigger = profile.querySelector('#user-profile-trigger') as HTMLButtonElement;
  const menu = profile.querySelector('#user-profile-menu') as HTMLElement;
  const signOutBtn = profile.querySelector('#sign-out-btn') as HTMLButtonElement;
  const resendVerificationBtn = profile.querySelector('#resend-verification-btn') as HTMLButtonElement | null;

  let isMenuOpen = false;

  // Toggle menu
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (isMenuOpen && !profile.contains(e.target as Node)) {
      closeMenu();
    }
  });

  // Sign out
  signOutBtn.addEventListener('click', async () => {
    try {
      await authService.signOut();
      animationService.animateSuccessMessage(createSuccessMessage('Signed out successfully'));
      
      if (options.onSignOut) {
        options.onSignOut();
      }
    } catch (error) {
      console.error('Sign out error:', error);
      animationService.animateMessage(createErrorMessage('Failed to sign out. Please try again.'), 'error');
    }
  });

  // Resend verification email
  if (resendVerificationBtn) {
    resendVerificationBtn.addEventListener('click', async () => {
      try {
        await authService.resendEmailVerification();
        animationService.animateSuccessMessage(
          createSuccessMessage('Verification email sent! Check your inbox.')
        );
      } catch (error) {
        console.error('Resend verification error:', error);
        animationService.animateMessage(
          createErrorMessage('Failed to send verification email. Please try again.'),
          'error'
        );
      }
    });
  }

  function toggleMenu(): void {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu(): void {
    isMenuOpen = true;
    menu.style.display = 'block';
    animationService.slideInRight(menu);
  }

  function closeMenu(): void {
    isMenuOpen = false;
    animationService.slideOutLeft(menu, () => {
      menu.style.display = 'none';
    });
  }

  return profile;
}

/**
 * Get user initials from email
 */
function getInitials(email: string): string {
  if (!email) return 'U';
  
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email[0].toUpperCase();
}

/**
 * Create success message element
 */
function createSuccessMessage(message: string): HTMLElement {
  const messageEl = document.createElement('div');
  messageEl.className = 'success-message';
  messageEl.textContent = message;
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
  `;
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    messageEl.remove();
  }, 5000);
  
  return messageEl;
}

/**
 * Create error message element
 */
function createErrorMessage(message: string): HTMLElement {
  const messageEl = document.createElement('div');
  messageEl.className = 'error-message';
  messageEl.textContent = message;
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
  `;
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    messageEl.remove();
  }, 5000);
  
  return messageEl;
}
