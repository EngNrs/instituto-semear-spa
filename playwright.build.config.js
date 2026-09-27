// playwright.build.config.js — roda a MESMA suíte de tests/, mas contra
// o resultado da build de produção (dist/), não contra o código-fonte.
//
// É a verificação central desta etapa: minificar/empacotar sem alterar
// o comportamento é uma afirmação que só vale alguma coisa se for
// testada — então em vez de só comparar bytes antes/depois, rodo os
// mesmos testes de roteamento, teclado/foco, validação e persistência
// apontando para dist/. Se algo aqui quebrar, a build tem um problema
// real, não só um número de redução bonito.
const { defineConfig } = require('@playwright/test');
const base = require('./playwright.config.js');

module.exports = defineConfig({
  ...base,
  use: { ...base.use, baseURL: 'http://127.0.0.1:8090' },
  webServer: {
    command: 'python3 -m http.server 8090 --directory dist',
    url: 'http://127.0.0.1:8090',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
