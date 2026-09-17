// Submódulo: Accesibilidad y Trampa de Foco WCAG 2.1 AA (AC-18)
export class FocusTrap {
  constructor(containerElement, onEscapeCallback) {
    this.container = containerElement;
    this.onEscape = onEscapeCallback;
    this.previouslyFocusedElement = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  activate() {
    this.previouslyFocusedElement = document.activeElement;
    document.addEventListener('keydown', this.handleKeyDown);

    // Mover foco al primer elemento interactivo o al contenedor
    setTimeout(() => {
      const focusables = this.getFocusableElements();
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        this.container.focus();
      }
    }, 50);
  }

  deactivate() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      this.previouslyFocusedElement.focus();
    }
  }

  getFocusableElements() {
    return Array.from(
      this.container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
  }

  handleKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      if (typeof this.onEscape === 'function') {
        this.onEscape();
      }
      return;
    }

    if (e.key === 'Tab') {
      const focusables = this.getFocusableElements();
      if (focusables.length === 0) return;

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift + Tab hacia atrás
        if (document.activeElement === firstElement || this.container.shadowRoot?.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab hacia adelante
        if (document.activeElement === lastElement || this.container.shadowRoot?.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
}
