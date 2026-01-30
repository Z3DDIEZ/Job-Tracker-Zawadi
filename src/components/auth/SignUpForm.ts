/**
 * Sign Up Form Component
 * Handles new user registration
 */

import { authService } from '@/services/authService';
import { animationService } from '@/services/animationService';
import type { AuthError } from '@/types';

export interface SignUpFormOptions {
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
  onSwitchToLogin?: () => void;
}

/**
 * Create sign up form component
 */
export function createSignUpForm(options: SignUpFormOptions = {}): HTMLElement {
  const form = document.createElement('form');
  form.className = 'auth-form signup-form';
  form.innerHTML = `
    <div class="auth-form-header">
      <h2>Create Account</h2>
      <p>Start tracking your job applications with a free account.</p>
    </div>
    
    <div class="auth-form-body">
      <div class="form-group">
        <label for="signup-email">Email</label>
        <input
          type="email"
          id="signup-email"
          name="email"
          required
          autocomplete="email"
          placeholder="your.email@example.com"
        />
        <span class="error-message" id="signup-email-error"></span>
      </div>
      
      <div class="form-group">
        <label for="signup-password">Password</label>
        <input
          type="password"
          id="signup-password"
          name="password"
          required
          autocomplete="new-password"
          placeholder="At least 6 characters"
          minlength="6"
        />
        <span class="error-message" id="signup-password-error"></span>
        <small class="form-hint">Password must be at least 6 characters long.</small>
      </div>
      
      <div class="form-group">
        <label for="signup-password-confirm">Confirm Password</label>
        <input
          type="password"
          id="signup-password-confirm"
          name="passwordConfirm"
          required
          autocomplete="new-password"
          placeholder="Re-enter your password"
        />
        <span class="error-message" id="signup-password-confirm-error"></span>
      </div>
      
      <div class="form-group">
        <button type="submit" class="btn btn-primary" id="signup-submit-btn">
          Create Account
        </button>
      </div>
      
      <div class="auth-form-footer">
        <p>Already have an account? <button type="button" class="link-button" id="switch-to-login-btn">Sign in</button></p>
      </div>
    </div>
  `;

  const emailInput = form.querySelector('#signup-email') as HTMLInputElement;
  const passwordInput = form.querySelector('#signup-password') as HTMLInputElement;
  const passwordConfirmInput = form.querySelector('#signup-password-confirm') as HTMLInputElement;
  const submitBtn = form.querySelector('#signup-submit-btn') as HTMLButtonElement;
  const emailError = form.querySelector('#signup-email-error') as HTMLElement;
  const passwordError = form.querySelector('#signup-password-error') as HTMLElement;
  const passwordConfirmError = form.querySelector('#signup-password-confirm-error') as HTMLElement;
  const switchToLoginBtn = form.querySelector('#switch-to-login-btn') as HTMLButtonElement;

  let isLoading = false;

  // Clear errors on input
  emailInput.addEventListener('input', () => {
    clearError(emailError);
  });

  passwordInput.addEventListener('input', () => {
    clearError(passwordError);
    // Check password match in real-time
    if (passwordConfirmInput.value && passwordInput.value !== passwordConfirmInput.value) {
      showError(passwordConfirmError, 'Passwords do not match');
    } else {
      clearError(passwordConfirmError);
    }
  });

  passwordConfirmInput.addEventListener('input', () => {
    if (passwordInput.value && passwordInput.value !== passwordConfirmInput.value) {
      showError(passwordConfirmError, 'Passwords do not match');
    } else {
      clearError(passwordConfirmError);
    }
  });

  // Form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (isLoading) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    // Clear previous errors
    clearError(emailError);
    clearError(passwordError);
    clearError(passwordConfirmError);

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

    if (password.length < 6) {
      showError(passwordError, 'Password must be at least 6 characters');
      animationService.shake(passwordInput);
      return;
    }

    if (password !== passwordConfirm) {
      showError(passwordConfirmError, 'Passwords do not match');
      animationService.shake(passwordConfirmInput);
      return;
    }

    // Submit
    isLoading = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    animationService.animateButtonLoading(submitBtn);

    try {
      await authService.signUp(email, password);

      // Success animation
      animationService.stopButtonLoading(submitBtn);
      animationService.animateSuccessMessage(
        createSuccessMessage('Account created! Please check your email to verify your account.')
      );

      if (options.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      animationService.stopButtonLoading(submitBtn);
      const authError = error as AuthError;

      // Show error
      if (authError.code.includes('email') || authError.code.includes('already-in-use')) {
        showError(emailError, authError.message);
        animationService.shake(emailInput);
      } else if (authError.code.includes('password') || authError.code.includes('weak-password')) {
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
      submitBtn.textContent = 'Create Account';
    }
  });

  // Switch to login
  if (options.onSwitchToLogin) {
    switchToLoginBtn.addEventListener('click', () => {
      options.onSwitchToLogin!();
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

  passwordConfirmInput.addEventListener('focus', () => {
    animationService.animateFormFieldFocus(passwordConfirmInput);
  });

  passwordConfirmInput.addEventListener('blur', () => {
    animationService.animateFormFieldBlur(passwordConfirmInput);
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
