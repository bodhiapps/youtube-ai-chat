import { Page, expect } from '@playwright/test';

export class ChatPage {
  constructor(private page: Page) {}

  selectors = {
    appTitle: '[data-testid="app-title"]',
    loginButton: '[data-testid="btn-auth-login"]',
    authenticated: '[data-testid="section-auth"][data-teststate="authenticated"]',
    clientReady: '[data-testid="badge-client-status"][data-teststate="ready"]',
    serverReady: '[data-testid="badge-server-status"][data-teststate="ready"]',
    setupOverlay: '[data-testid="div-setup-overlay"]',
    setupIframe: '[data-testid="iframe-setup"]',
    chatInput: '[data-testid="chat-input"]',
    sendButton: '[data-testid="send-button"]',
    modelSelector: '[data-testid="model-selector"]',
    refreshModels: '[data-testid="btn-refresh-models"]',
    chatProcessing: '[data-testid="chat-processing"]',
    message: (turn: number, role: string) =>
      `[data-testid="chat-message-turn-${turn}"][data-messagetype="${role}"]`,
  };

  async waitServerReady(): Promise<void> {
    await this.page.locator(this.selectors.appTitle).waitFor();
    await this.page.locator(this.selectors.clientReady).waitFor();
    await this.page.locator(this.selectors.serverReady).waitFor();
  }

  async login(credentials: { username: string; password: string }): Promise<void> {
    await this.page.locator(this.selectors.loginButton).click();

    // Bodhi server branded login page → click Login → redirects to Keycloak
    await this.page.waitForURL(/\/ui\/login/);
    await this.page.getByRole('button', { name: 'Login', exact: true }).click();

    // Keycloak login form
    await this.page.waitForURL(/\/realms\/bodhi\//);
    await this.page.locator('#username').waitFor();
    await this.page.fill('#username', credentials.username);
    await this.page.fill('#password', credentials.password);
    await this.page.click('#kc-login');

    // Access request review → uncheck MCP → approve
    await this.page.waitForURL(/\/access-requests\/review/);
    await this.page.locator('[role="checkbox"]').first().click();
    await this.page.getByRole('button', { name: /Approve/ }).click();

    // After approve: Keycloak SSO auto-completes the PKCE flow (same browser
    // context as the login above), redirecting back to the app via 302 chain.
    await this.page.waitForURL(/localhost:5173/);
    await this.page.locator(this.selectors.authenticated).waitFor();
    await this.dismissSetupModal();
  }

  async dismissSetupModal(): Promise<void> {
    const iframe = this.page.frameLocator(this.selectors.setupIframe);
    await iframe.getByTestId('continue-button').click();
    await this.page.locator(this.selectors.setupOverlay).waitFor({ state: 'detached' });
  }

  async loadModels(): Promise<void> {
    await this.page.locator(this.selectors.refreshModels).click();
    await expect(this.page.locator(this.selectors.modelSelector)).toBeEnabled();
  }

  async selectModel(modelId: string): Promise<void> {
    const trigger = this.page.locator(this.selectors.modelSelector);
    await expect(trigger).toBeEnabled();
    await trigger.click();
    await this.page.getByRole('option', { name: modelId, exact: true }).click();
    await expect(trigger).toContainText(modelId);
  }

  async send(prompt: string): Promise<void> {
    await this.page.locator(this.selectors.chatInput).fill(prompt);
    await this.page.locator(this.selectors.sendButton).click();
  }

  async waitForAssistantTurn(turn: number): Promise<void> {
    await this.page.locator(this.selectors.message(turn, 'assistant')).waitFor();
    await this.page.locator(this.selectors.chatProcessing).waitFor({ state: 'hidden' });
  }

  async getAssistantText(turn: number): Promise<string> {
    return (await this.page.locator(this.selectors.message(turn, 'assistant')).textContent()) ?? '';
  }
}
