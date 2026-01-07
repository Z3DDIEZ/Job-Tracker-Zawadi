/**
 * Animation Service
 * Centralized animation service using anime.js
 * Provides accessible, performant animations with reduced motion support
 */

import { animate, createTimeline } from 'animejs';
import { stagger } from 'animejs/utils';

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animation Service Class
 * Provides static methods for common animations
 */
export class AnimationService {
  /**
   * Animate status change on a badge or element
   */
  static animateStatusChange(
    element: HTMLElement | null,
    newColor: string,
    options?: { duration?: number; scale?: boolean }
  ): void {
    if (!element || prefersReducedMotion()) {
      if (element) {
        element.style.backgroundColor = newColor;
      }
      return;
    }

    const duration = options?.duration || 400;
    const shouldScale = options?.scale !== false;

    animate({
      targets: element,
      backgroundColor: newColor,
      scale: shouldScale ? [1, 1.15, 1] : 1,
      duration,
      easing: 'easeOutElastic(1, .6)',
    });
  }

  /**
   * Animate card/row highlight pulse
   */
  static animateHighlight(element: HTMLElement | null): void {
    if (!element || prefersReducedMotion()) return;

    animate({
      targets: element,
      backgroundColor: ['rgba(217, 119, 6, 0.1)', 'rgba(217, 119, 6, 0.3)', 'rgba(217, 119, 6, 0.1)'],
      duration: 600,
      easing: 'easeInOutQuad',
    });
  }

  /**
   * Transition between views
   */
  static transitionView(
    fromElement: HTMLElement | null,
    toElement: HTMLElement | null,
    options?: { duration?: number; direction?: 'horizontal' | 'vertical' }
  ): void {
    if (prefersReducedMotion()) {
      if (fromElement) fromElement.style.display = 'none';
      if (toElement) toElement.style.display = 'block';
      return;
    }

    const duration = options?.duration || 300;
    const direction = options?.direction || 'horizontal';
    const translateProp = direction === 'horizontal' ? 'translateX' : 'translateY';
    const translateAmount = direction === 'horizontal' ? 20 : 10;

    const timeline = anime.createTimeline({
      easing: 'easeInOutQuad',
      duration,
    });

    if (fromElement) {
      timeline.add({
        targets: fromElement,
        opacity: [1, 0],
        [translateProp]: [0, -translateAmount],
        complete: () => {
          if (fromElement) fromElement.style.display = 'none';
        },
      });
    }

    if (toElement) {
      timeline.add(
        {
          targets: toElement,
          opacity: [0, 1],
          [translateProp]: [translateAmount, 0],
          begin: () => {
            if (toElement) toElement.style.display = 'block';
          },
        },
        '-=150' // Start slightly before previous animation ends
      );
    }
  }

  /**
   * Animate card entrance with stagger
   */
  static animateCardEntrance(
    cards: NodeListOf<HTMLElement> | HTMLElement[],
    options?: { delay?: number; startDelay?: number }
  ): void {
    if (prefersReducedMotion() || cards.length === 0) {
      // Instant show for reduced motion
      Array.from(cards).forEach((card) => {
        card.style.opacity = '1';
        card.style.transform = 'none';
      });
      return;
    }

    const delay = options?.delay || 50;
    const startDelay = options?.startDelay || 0;

    animate({
      targets: Array.from(cards),
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.95, 1],
      delay: stagger(delay, { start: startDelay }),
      duration: 500,
      easing: 'easeOutCubic',
    });
  }

  /**
   * Animate card deletion
   */
  static animateCardDeletion(
    card: HTMLElement | null,
    onComplete?: () => void
  ): void {
    if (!card) {
      onComplete?.();
      return;
    }

    if (prefersReducedMotion()) {
      card.remove();
      onComplete?.();
      return;
    }

    animate({
      targets: card,
      opacity: [1, 0],
      scale: [1, 0.8],
      translateY: [0, -20],
      duration: 300,
      easing: 'easeInQuad',
      complete: () => {
        card.remove();
        onComplete?.();
      },
    });
  }

  /**
   * Animate form field focus
   */
  static animateFormFieldFocus(field: HTMLElement | null): void {
    if (!field || prefersReducedMotion()) return;

    animate({
      targets: field,
      scale: [1, 1.02],
      duration: 200,
      easing: 'easeOutQuad',
    });
  }

  /**
   * Animate form field blur
   */
  static animateFormFieldBlur(field: HTMLElement | null): void {
    if (!field || prefersReducedMotion()) return;

    anime.animate({
      targets: field,
      scale: [1.02, 1],
      duration: 200,
      easing: 'easeInQuad',
    });
  }

  /**
   * Animate button loading state
   */
  static animateButtonLoading(button: HTMLElement | null): void {
    if (!button || prefersReducedMotion()) return;

    animate({
      targets: button,
      opacity: [1, 0.7, 1],
      duration: 1000,
      easing: 'easeInOutQuad',
      loop: true,
    });
  }

  /**
   * Stop button loading animation
   */
  static stopButtonLoading(button: HTMLElement | null): void {
    if (!button) return;
    // Stop any running animations on the button
    // In anime.js v4, we reset the opacity directly
    // The animation will naturally complete or be overridden
    button.style.opacity = '1';
    button.style.transition = 'none';
    // Force a reflow to apply the style immediately
    void button.offsetHeight;
    button.style.transition = '';
  }

  /**
   * Animate success/error message appearance
   */
  static animateMessage(
    message: HTMLElement | null,
    type: 'success' | 'error' | 'info' = 'info'
  ): void {
    if (!message || prefersReducedMotion()) {
      if (message) message.style.opacity = '1';
      return;
    }

    animate({
      targets: message,
      opacity: [0, 1],
      translateY: [-10, 0],
      scale: [0.95, 1],
      duration: 300,
      easing: 'easeOutQuad',
    });
  }

  /**
   * Animate chart container entrance
   */
  static animateChartEntrance(
    charts: NodeListOf<HTMLElement> | HTMLElement[],
    options?: { delay?: number }
  ): void {
    if (prefersReducedMotion() || charts.length === 0) {
      Array.from(charts).forEach((chart) => {
        chart.style.opacity = '1';
        chart.style.transform = 'none';
      });
      return;
    }

    const delay = options?.delay || 100;

    animate({
      targets: Array.from(charts),
      opacity: [0, 1],
      scale: [0.95, 1],
      delay: stagger(delay),
      duration: 500,
      easing: 'easeOutElastic(1, .6)',
    });
  }

  /**
   * Animate filter dropdown
   */
  static animateFilterDropdown(dropdown: HTMLElement | null, isOpen: boolean): void {
    if (!dropdown || prefersReducedMotion()) return;

    if (isOpen) {
      animate({
        targets: dropdown,
        opacity: [0, 1],
        scaleY: [0, 1],
        duration: 200,
        easing: 'easeOutQuad',
      });
    } else {
      animate({
        targets: dropdown,
        opacity: [1, 0],
        scaleY: [1, 0],
        duration: 150,
        easing: 'easeInQuad',
      });
    }
  }

  /**
   * Animate search highlight
   */
  static animateSearchHighlight(element: HTMLElement | null): void {
    if (!element || prefersReducedMotion()) return;

    animate({
      targets: element,
      backgroundColor: ['rgba(217, 119, 6, 0.2)', 'rgba(217, 119, 6, 0)', 'rgba(217, 119, 6, 0.2)'],
      duration: 1000,
      easing: 'easeInOutQuad',
    });
  }
}
