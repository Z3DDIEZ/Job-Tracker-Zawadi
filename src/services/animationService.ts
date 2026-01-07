/**
 * Animation Service v4.0 - anime.js v4 Compatible
 * Handles all animations with proper sequencing and cleanup
 */

import { animate, set, createTimeline, stagger } from 'animejs';

// Type for animation instances (both animate() and createTimeline() return similar objects)
type AnimationInstance = ReturnType<typeof animate> | ReturnType<typeof createTimeline>;

interface AnimationConfig {
  targets: string | HTMLElement | HTMLElement[] | NodeList;
  duration?: number;
  easing?: string;
  delay?: number;
  complete?: () => void;
}

class AnimationService {
  private activeAnimations: Map<string, AnimationInstance> = new Map();
  private prefersReducedMotion: boolean;

  constructor() {
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });
  }

  /**
   * Check if animations should run
   */
  private shouldAnimate(): boolean {
    return !this.prefersReducedMotion;
  }

  /**
   * Store and cleanup animations
   */
  private registerAnimation(key: string, animation: AnimationInstance) {
    // Cancel existing animation with same key
    if (this.activeAnimations.has(key)) {
      const existing = this.activeAnimations.get(key);
      if (existing) {
        existing.pause();
        existing.seek(existing.duration);
      }
    }
    this.activeAnimations.set(key, animation);
  }

  /**
   * Cancel specific animation
   */
  cancelAnimation(key: string) {
    const animation = this.activeAnimations.get(key);
    if (animation) {
      animation.pause();
      animation.seek(animation.duration);
      this.activeAnimations.delete(key);
    }
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations() {
    this.activeAnimations.forEach((animation) => {
      animation.pause();
      animation.seek(animation.duration);
    });
    this.activeAnimations.clear();
  }

  // ========================================
  // CARD ANIMATIONS
  // ========================================

  /**
   * Staggered entrance animation for cards
   */
  animateCardsEntrance(cardSelector: string = '.job-card') {
    if (!this.shouldAnimate()) return;

    const cards = document.querySelectorAll(cardSelector);
    if (!cards.length) return;

    // Reset initial state
    set(cards, {
      opacity: 0,
      translateY: 50,
      scale: 0.9
    });

    const animation = animate(cards, {
      opacity: [0, 1],
      translateY: [50, 0],
      scale: [0.9, 1],
      duration: 600,
      delay: stagger(100, { start: 0 }), // 100ms between each card
      ease: 'out-cubic',
      onComplete: () => {
        this.activeAnimations.delete('cards-entrance');
      }
    });

    this.registerAnimation('cards-entrance', animation);
  }

  /**
   * Single card entrance (for newly added cards)
   */
  animateCardAdd(cardElement: HTMLElement) {
    if (!this.shouldAnimate()) {
      cardElement.style.opacity = '1';
      return;
    }

    // Reset initial state
    set(cardElement, {
      opacity: 0,
      translateY: 30,
      scale: 0.95
    });

    const animation = animate(cardElement, {
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.95, 1],
      duration: 500,
      ease: 'out-back',
      onComplete: () => {
        this.activeAnimations.delete(`card-add-${cardElement.id}`);
      }
    });

    this.registerAnimation(`card-add-${cardElement.id}`, animation);
  }

  /**
   * Card deletion animation
   */
  animateCardRemove(cardElement: HTMLElement, onComplete?: () => void) {
    if (!this.shouldAnimate()) {
      if (onComplete) onComplete();
      return;
    }

    const animation = animate(cardElement, {
      opacity: [1, 0],
      translateX: [0, -100],
      scale: [1, 0.8],
      rotate: [0, -5],
      duration: 400,
      ease: 'in-cubic',
      onComplete: () => {
        this.activeAnimations.delete(`card-remove-${cardElement.id}`);
        if (onComplete) onComplete();
      }
    });

    this.registerAnimation(`card-remove-${cardElement.id}`, animation);
  }

  /**
   * Card hover animation (call on mouseenter)
   */
  animateCardHover(cardElement: HTMLElement) {
    if (!this.shouldAnimate()) return;

    // Cancel any existing hover animation for this card
    this.cancelAnimation(`card-hover-${cardElement.id}`);

    const animation = animate(cardElement, {
      translateY: -8,
      scale: 1.02,
      duration: 300,
      ease: 'out-cubic'
    });

    this.registerAnimation(`card-hover-${cardElement.id}`, animation);
  }

  /**
   * Card hover reset (call on mouseleave)
   */
  animateCardHoverReset(cardElement: HTMLElement) {
    if (!this.shouldAnimate()) return;

    // Cancel any existing hover animation for this card
    this.cancelAnimation(`card-hover-${cardElement.id}`);

    const animation = animate(cardElement, {
      translateY: 0,
      scale: 1,
      duration: 300,
      ease: 'out-cubic'
    });

    this.registerAnimation(`card-hover-${cardElement.id}`, animation);
  }

  // ========================================
  // STATUS CHANGE ANIMATIONS
  // ========================================

  /**
   * Animate status badge change
   */
  animateStatusChange(badgeElement: HTMLElement, onComplete?: () => void) {
    if (!this.shouldAnimate()) {
      if (onComplete) onComplete();
      return;
    }

    const tl = createTimeline({
      onComplete: () => {
        this.activeAnimations.delete(`status-${badgeElement.id}`);
        if (onComplete) onComplete();
      }
    });

    // Timeline.add() signature: add(target, parameters, position)
    tl.add(badgeElement, {
      scale: [1, 1.2],
      opacity: [1, 0.7],
      duration: 200,
      ease: 'out-cubic'
    }).add(badgeElement, {
      scale: [1.2, 1],
      opacity: [0.7, 1],
      duration: 200,
      ease: 'out-cubic'
    });

    this.registerAnimation(`status-${badgeElement.id}`, tl);
  }

  /**
   * Pulse animation for status update notification
   */
  pulseElement(element: HTMLElement, count: number = 2) {
    if (!this.shouldAnimate()) return;

    const animation = animate(element, {
      scale: [1, 1.05, 1],
      duration: 500,
      ease: 'inout-quad',
      loop: count,
      onComplete: () => {
        this.activeAnimations.delete(`pulse-${element.id}`);
      }
    });

    this.registerAnimation(`pulse-${element.id}`, animation);
  }

  // ========================================
  // VIEW MODE TRANSITIONS
  // ========================================

  /**
   * Fade out current view
   */
  fadeOutView(containerSelector: string, onComplete?: () => void) {
    if (!this.shouldAnimate()) {
      if (onComplete) onComplete();
      return;
    }

    const container = document.querySelector(containerSelector);
    if (!container) {
      if (onComplete) onComplete();
      return;
    }

    const animation = animate(container, {
      opacity: [1, 0],
      translateY: [0, -20],
      duration: 300,
      ease: 'in-cubic',
      onComplete: () => {
        this.activeAnimations.delete('view-fade-out');
        if (onComplete) onComplete();
      }
    });

    this.registerAnimation('view-fade-out', animation);
  }

  /**
   * Fade in new view
   */
  fadeInView(containerSelector: string) {
    if (!this.shouldAnimate()) {
      const container = document.querySelector(containerSelector);
      if (container) {
        (container as HTMLElement).style.opacity = '1';
      }
      return;
    }

    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Reset initial state
    set(container, {
      opacity: 0,
      translateY: 20
    });

    const animation = animate(container, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 400,
      ease: 'out-cubic',
      onComplete: () => {
        this.activeAnimations.delete('view-fade-in');
      }
    });

    this.registerAnimation('view-fade-in', animation);
  }

  /**
   * Smooth view transition (handles both fade out and fade in)
   */
  transitionView(
    oldViewSelector: string,
    newViewSelector: string,
    onMiddle?: () => void
  ) {
    this.fadeOutView(oldViewSelector, () => {
      if (onMiddle) onMiddle();
      // Small delay before fading in new view
      setTimeout(() => {
        this.fadeInView(newViewSelector);
      }, 100);
    });
  }

  // ========================================
  // FORM ANIMATIONS
  // ========================================

  /**
   * Input focus animation
   */
  animateInputFocus(inputElement: HTMLElement) {
    if (!this.shouldAnimate()) return;

    const animation = animate(inputElement, {
      scale: [1, 1.02, 1],
      duration: 300,
      ease: 'out-cubic'
    });

    this.registerAnimation(`input-focus-${inputElement.id}`, animation);
  }

  /**
   * Button press animation
   */
  animateButtonPress(buttonElement: HTMLElement, onComplete?: () => void) {
    if (!this.shouldAnimate()) {
      if (onComplete) onComplete();
      return;
    }

    const tl = createTimeline({
      onComplete: () => {
        this.activeAnimations.delete(`button-${buttonElement.id}`);
        if (onComplete) onComplete();
      }
    });

    tl.add(buttonElement, {
      scale: 0.95,
      duration: 100,
      ease: 'out-cubic'
    }).add(buttonElement, {
      scale: 1,
      duration: 100,
      ease: 'out-cubic'
    });

    this.registerAnimation(`button-${buttonElement.id}`, tl);
  }

  /**
   * Success message animation
   */
  animateSuccessMessage(messageElement: HTMLElement, duration: number = 3000) {
    if (!this.shouldAnimate()) {
      messageElement.style.opacity = '1';
      setTimeout(() => {
        messageElement.style.opacity = '0';
      }, duration);
      return;
    }

    // Reset initial state
    set(messageElement, {
      opacity: 0,
      translateY: -20
    });

    const tl = createTimeline({
      onComplete: () => {
        this.activeAnimations.delete(`message-${messageElement.id}`);
      }
    });

    tl
      // Fade in
      .add(messageElement, {
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 400,
        ease: 'out-cubic'
      })
      // Hold - add a timer without target
      .add({
        duration: duration
      })
      // Fade out
      .add(messageElement, {
        opacity: [1, 0],
        translateY: [0, 20],
        duration: 400,
        ease: 'in-cubic'
      });

    this.registerAnimation(`message-${messageElement.id}`, tl);
  }

  // ========================================
  // CHART ANIMATIONS
  // ========================================

  /**
   * Animate chart container entrance
   */
  animateChartEntrance(chartContainer: HTMLElement) {
    if (!this.shouldAnimate()) {
      chartContainer.style.opacity = '1';
      return;
    }

    // Reset initial state
    set(chartContainer, {
      opacity: 0,
      translateY: 30,
      scale: 0.95
    });

    const animation = animate(chartContainer, {
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.95, 1],
      duration: 600,
      ease: 'out-cubic',
      onComplete: () => {
        this.activeAnimations.delete(`chart-${chartContainer.id}`);
      }
    });

    this.registerAnimation(`chart-${chartContainer.id}`, animation);
  }

  /**
   * Staggered entrance for multiple charts
   */
  animateChartsEntrance(chartSelector: string = '.chart-container') {
    if (!this.shouldAnimate()) return;

    const charts = document.querySelectorAll(chartSelector);
    if (!charts.length) return;

    // Reset initial state
    set(charts, {
      opacity: 0,
      translateY: 50,
      scale: 0.95
    });

    const animation = animate(charts, {
      opacity: [0, 1],
      translateY: [50, 0],
      scale: [0.95, 1],
      duration: 700,
      delay: stagger(150),
      ease: 'out-cubic',
      onComplete: () => {
        this.activeAnimations.delete('charts-entrance');
      }
    });

    this.registerAnimation('charts-entrance', animation);
  }

  // ========================================
  // LOADING ANIMATIONS
  // ========================================

  /**
   * Show loading spinner
   */
  showLoading(loadingElement: HTMLElement) {
    if (!this.shouldAnimate()) {
      loadingElement.style.display = 'block';
      loadingElement.style.opacity = '1';
      return;
    }

    loadingElement.style.display = 'block';

    const animation = animate(loadingElement, {
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 300,
      ease: 'out-cubic'
    });

    this.registerAnimation('loading-show', animation);
  }

  /**
   * Hide loading spinner
   */
  hideLoading(loadingElement: HTMLElement, onComplete?: () => void) {
    if (!this.shouldAnimate()) {
      loadingElement.style.display = 'none';
      if (onComplete) onComplete();
      return;
    }

    const animation = animate(loadingElement, {
      opacity: [1, 0],
      scale: [1, 0.8],
      duration: 300,
      ease: 'in-cubic',
      onComplete: () => {
        loadingElement.style.display = 'none';
        this.activeAnimations.delete('loading-hide');
        if (onComplete) onComplete();
      }
    });

    this.registerAnimation('loading-hide', animation);
  }

  // ========================================
  // UTILITY ANIMATIONS
  // ========================================

  /**
   * Shake animation for errors
   */
  shake(element: HTMLElement) {
    if (!this.shouldAnimate()) return;

    const animation = animate(element, {
      translateX: [
        { to: -10, duration: 100 },
        { to: 10, duration: 100 },
        { to: -10, duration: 100 },
        { to: 10, duration: 100 },
        { to: 0, duration: 100 }
      ],
      ease: 'out-cubic',
      onComplete: () => {
        this.activeAnimations.delete(`shake-${element.id}`);
      }
    });

    this.registerAnimation(`shake-${element.id}`, animation);
  }

  /**
   * Bounce animation
   */
  bounce(element: HTMLElement, height: number = 20) {
    if (!this.shouldAnimate()) return;

    const animation = animate(element, {
      translateY: [
        { to: -height, duration: 200 },
        { to: 0, duration: 200 }
      ],
      ease: 'out-cubic',
      loop: 2,
      onComplete: () => {
        this.activeAnimations.delete(`bounce-${element.id}`);
      }
    });

    this.registerAnimation(`bounce-${element.id}`, animation);
  }

  /**
   * Slide in from right
   */
  slideInRight(element: HTMLElement) {
    if (!this.shouldAnimate()) {
      element.style.opacity = '1';
      return;
    }

    set(element, {
      opacity: 0,
      translateX: 100
    });

    const animation = animate(element, {
      opacity: [0, 1],
      translateX: [100, 0],
      duration: 400,
      ease: 'out-cubic',
      onComplete: () => {
        this.activeAnimations.delete(`slide-${element.id}`);
      }
    });

    this.registerAnimation(`slide-${element.id}`, animation);
  }

  /**
   * Slide out to left
   */
  slideOutLeft(element: HTMLElement, onComplete?: () => void) {
    if (!this.shouldAnimate()) {
      if (onComplete) onComplete();
      return;
    }

    const animation = animate(element, {
      opacity: [1, 0],
      translateX: [0, -100],
      duration: 400,
      ease: 'in-cubic',
      onComplete: () => {
        this.activeAnimations.delete(`slide-${element.id}`);
        if (onComplete) onComplete();
      }
    });

    this.registerAnimation(`slide-${element.id}`, animation);
  }
}

// Export singleton instance
export { AnimationService };
export const animationService = new AnimationService();
export default animationService;