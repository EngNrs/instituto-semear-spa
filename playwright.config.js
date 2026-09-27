// playwright.config.js — configuração mínima dos testes end-to-end.
//
// Por que precisa de um servidor HTTP? Os módulos ES (import/export em
// js/app.js e companhia) só executam sob os protocolos http:/https: —
// abrir index.html direto do disco (file://) falha com erro de CORS
// ("origin 'null' has been blocked"). O bloco "webServer" abaixo sobe
// um servidor descartável (o mesmo "npm start") só para a duração dos
// testes e derruba sozinho ao final.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Em máquinas comuns, "npx playwright install" já resolve o
        // Chromium sozinho (launchOptions vazio = comportamento padrão).
        // A variável abaixo só existe para ambientes com um Chromium
        // pré-instalado em local não padrão — não precisa ser definida
        // para rodar os testes normalmente.
        launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
          : {},
      },
    },
  ],
  webServer: {
    command: 'python3 -m http.server 8080',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
