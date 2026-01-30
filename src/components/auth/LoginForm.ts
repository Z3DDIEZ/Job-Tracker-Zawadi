/**
 * Login Form Component
 * Handles user authentication
 */

import { authService } from '@/services/authService';
import { animationService } from '@/services/animationService';
import type { AuthError } from '@/types';

export interface LoginFormOptions {
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
  onSwitchToSignUp?: () => void;
  onContinueAsGuest?: () => void;
}

/**
 * Create login form component
 */
export function createLoginForm(options: LoginFormOptions = {}): HTMLElement {
  const form = document.createElement('form');
  form.className = 'auth-form login-form';
  form.innerHTML = `
    <div class="auth-form-header">
      <h2>Sign In</h2>
      <p>Welcome back! Sign in to continue tracking your applications.</p>
    </div>
    
    <div class="auth-form-body">
      <div class="form-group">
        <label for="login-email">Email</label>
        <input
          type="email"
          id="login-email"
          name="email"
          required
          autocomplete="email"
          placeholder="your.email@example.com"
        />
        <span class="error-message" id="login-email-error"></span>
      </div>
      
      <div class="form-group">
        <label for="login-password">Password</label>
        <input
          type="password"
          id="login-password"
          name="password"
          required
          autocomplete="current-password"
          placeholder="Enter your password"
        />
        <span class="error-message" id="login-password-error"></span>
      </div>
      
      <div class="form-group">
        <button type="button" class="link-button" id="forgot-password-btn">
          Forgot password?
        </button>
      </div>
      
      <div class="form-group">
        <button type="submit" class="btn btn-primary" id="login-submit-btn">
          Sign In
        </button>
      </div>
      
      <div class="auth-form-footer">
        <p>Don't have an account? <button type="button" class="link-button" id="switch-to-signup-btn">Sign up</button></p>
        <div class="guest-option" style="margin-top: 1rem; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
          <button type="button" class="btn btn-secondary" id="guest-mode-btn" style="background: #f1f5f9; color: #475569; width: 100%;">
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  `;

  const emailInput = form.querySelector('#login-email') as HTMLInputElement;
  const passwordInput = form.querySelector('#login-password') as HTMLInputElement;
  const submitBtn = form.querySelector('#login-submit-btn') as HTMLButtonElement;
  const emailError = form.querySelector('#login-email-error') as HTMLElement;
  const passwordError = form.querySelector('#login-password-error') as HTMLElement;
  const forgotPasswordBtn = form.querySelector('#forgot-password-btn') as HTMLButtonElement;
  const switchToSignUpBtn = form.querySelector('#switch-to-signup-btn') as HTMLButtonElement;
  const guestModeBtn = form.querySelector('#guest-mode-btn') as HTMLButtonElement;

  if (options.onContinueAsGuest) {
    guestModeBtn.addEventListener('click', () => {
      options.onContinueAsGuest?.();
    });
  }

  let isLoading = false;

  // Clear errors on input
  emailInput.addEventListener('input', () => {
    clearError(emailError);
  });

  passwordInput.addEventListener('input', () => {
    clearError(passwordError);
  });

  // Form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (isLoading) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Clear previous errors
    clearError(emailError);
    clearError(passwordError);

    // Validate
    if (!email) {
      showError(emailError, 'Email is required');
      animationService.shake(emailInput);
      return;
    }

    if (!password) {
      showError(passwordError, 'Password is required');
      animationService.shake(passwordInput);
      return;
    }

    // Submit
    isLoading = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    animationService.animateButtonLoading(submitBtn);

    try {
      await authService.signIn(email, password);

      // Success animation
      animationService.stopButtonLoading(submitBtn);
      animationService.animateSuccessMessage(createSuccessMessage('Signed in successfully!'));

      if (options.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      animationService.stopButtonLoading(submitBtn);
      const authError = error as AuthError;

      // Show error
      if (authError.code.includes('email') || authError.code.includes('user-not-found')) {
        showError(emailError, authError.message);
        animationService.shake(emailInput);
      } else if (authError.code.includes('password') || authError.code.includes('wrong-password')) {
        showError(passwordError, authError.message);
        animationService.shake(passwordInput);
      } else {
        showError(emailError, authError.message);
        animationService.shake(form);
      }

      if (options.onError) {
        options.onError(authError);
      }
    } finally {
      isLoading = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });

  // Forgot password
  forgotPasswordBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();

    if (!email) {
      showError(emailError, 'Please enter your email address');
      animationService.shake(emailInput);
      return;
    }

    try {
      await authService.sendPasswordResetEmail(email);
      animationService.animateSuccessMessage(
        createSuccessMessage('Password reset email sent! Check your inbox.')
      );
    } catch (error) {
      const authError = error as AuthError;
      showError(emailError, authError.message);
      animationService.shake(emailInput);
    }
  });

  // Switch to sign up
  if (options.onSwitchToSignUp) {
    switchToSignUpBtn.addEventListener('click', () => {
      options.onSwitchToSignUp!();
    });
  }

  // Focus animations
  emailInput.addEventListener('focus', () => {
    animationService.animateFormFieldFocus(emailInput);
  });

  emailInput.addEventListener('blur', () => {
    animationService.animateFormFieldBlur(emailInput);
  });

  passwordInput.addEventListener('focus', () => {
    animationService.animateFormFieldFocus(passwordInput);
  });

  passwordInput.addEventListener('blur', () => {
    animationService.animateFormFieldBlur(passwordInput);
  });

  return form;
}

/**
 * Show error message
 */
function showError(element: HTMLElement, message: string): void {
  element.textContent = message;
  element.style.display = 'block';
  animationService.animateMessage(element, 'error');
}

/**
 * Clear error message
 */
function clearError(element: HTMLElement): void {
  element.textContent = '';
  element.style.display = 'none';
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

  // Remove after animation
  setTimeout(() => {
    messageEl.remove();
  }, 5000);

  return messageEl;
}
