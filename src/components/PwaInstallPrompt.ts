export class PwaInstallPrompt {
    private installPrompt: any = null;
    private container: HTMLElement;
    private installButton!: HTMLButtonElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'pwa-install-container';
        this.container.style.display = 'none'; // Hidden by default

        // Add styles dynamically
        const style = document.createElement('style');
        style.textContent = `
      .pwa-install-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        background: var(--bg-card, #ffffff);
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border-color, #e2e8f0);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        animation: slideIn 0.3s ease-out;
      }
      .pwa-install-title {
        font-weight: 600;
        color: var(--text-primary, #0f172a);
        font-size: 0.9rem;
      }
      .pwa-install-btn {
        background: var(--primary-color, #d97706);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s;
      }
      .pwa-install-btn:hover {
        background: #b45309;
      }
      .pwa-close-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary, #64748b);
        font-size: 0.8rem;
        cursor: pointer;
        text-decoration: underline;
        margin-top: 0.2rem;
      }
      @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
        document.head.appendChild(style);

        this.render();
        this.init();
    }

    private render() {
        this.container.innerHTML = `
      <div class="pwa-install-title">Install App</div>
      <button class="pwa-install-btn">Install</button>
      <button class="pwa-close-btn">Not now</button>
    `;

        document.body.appendChild(this.container);

        this.installButton = this.container.querySelector('.pwa-install-btn') as HTMLButtonElement;
        const closeBtn = this.container.querySelector('.pwa-close-btn') as HTMLButtonElement;

        this.installButton.addEventListener('click', () => this.handleInstall());
        closeBtn.addEventListener('click', () => {
            this.container.style.display = 'none';
        });
    }

    private init() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            this.installPrompt = e;
            // Update UI to notify the user they can add to home screen
            this.container.style.display = 'flex';
            console.log('PWA install prompt captured');
        });

        window.addEventListener('appinstalled', () => {
            // Hide the app-provided install promotion
            this.container.style.display = 'none';
            this.installPrompt = null;
            console.log('PWA was installed');
        });
    }

    private async handleInstall() {
        if (!this.installPrompt) return;

        // Show the install prompt
        this.installPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await this.installPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        this.installPrompt = null;
        this.container.style.display = 'none';
    }
}
