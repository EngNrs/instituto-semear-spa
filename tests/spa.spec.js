// tests/spa.spec.js — suíte de testes end-to-end da SPA (Playwright).
//
// Cobre os três comportamentos mais sensíveis a regressão, todos
// exercitados manualmente ao longo do desenvolvimento e agora
// automatizados: roteamento + acessibilidade (título/foco por rota),
// validação do formulário de cadastro e persistência via localStorage.
const { test, expect } = require('@playwright/test');

// A busca de endereço por CEP (js/validacao.js) chama a API pública
// ViaCEP. Interceptar a requisição mantém os testes determinísticos e
// independentes de rede/terceiros — sem isso, o teste de envio válido
// dependeria da ViaCEP estar no ar.
async function interceptarViaCEP(page) {
  await page.route('https://viacep.com.br/**', function (route) {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        logradouro: 'Rua das Acácias',
        bairro: 'Vila Esperança',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    });
  });
}

test.describe('Roteamento e acessibilidade (SPA via hash)', function () {
  test('primeiro carregamento define o título e não rouba o foco', async function ({ page }) {
    await page.goto('/');
    await expect(page).toHaveTitle('Instituto Semear — Início');
    const foco = await page.evaluate(function () { return document.activeElement.tagName; });
    expect(foco).toBe('BODY');
  });

  test('navegar para /projetos troca o título e move o foco para o novo <h1>', async function ({ page }) {
    await page.goto('/');
    await page.click('a[data-rota="/projetos"]');
    await expect(page).toHaveTitle('Instituto Semear — Projetos');
    const h1 = page.locator('#conteudo-principal h1');
    await expect(h1).toBeFocused();
  });

  test('rota desconhecida cai na rota padrão ("/")', async function ({ page }) {
    await page.goto('/#/rota-que-nao-existe');
    await expect(page).toHaveTitle('Instituto Semear — Início');
  });
});

test.describe('Validação do formulário de cadastro', function () {
  test('CPF inválido é rejeitado e mantém o usuário na rota', async function ({ page }) {
    await page.goto('/#/cadastro');
    await page.fill('#cpf', '111.111.111-11'); // dígitos repetidos: falha no algoritmo de checksum
    await page.locator('#cpf').blur();
    await expect(page.locator('#cpf-erro')).toHaveText(/CPF inválido/);
    await expect(page.locator('#cpf')).toHaveAttribute('aria-invalid', 'true');
  });

  test('envio com todos os campos válidos mostra a confirmação', async function ({ page }) {
    await interceptarViaCEP(page);
    await page.goto('/#/cadastro');

    await page.fill('#nome', 'Maria da Silva');
    await page.fill('#cpf', '52998224725'); // CPF numericamente válido
    await page.fill('#nascimento', '1990-05-20');
    await page.fill('#telefone', '11912345678');
    await page.fill('#email', 'maria@exemplo.com');
    await page.fill('#cep', '04567000');
    await page.locator('#cep').blur();
    await expect(page.locator('#logradouro')).toHaveValue('Rua das Acácias');
    await page.fill('#numero', '245');
    await page.selectOption('#projeto', 'qualquer');
    await page.check('#consentimento');

    await page.click('button[type="submit"]');

    await expect(page.locator('#confirmacao-envio')).toBeVisible();
    await expect(page.locator('#confirmacao-envio')).toContainText('Maria');
  });
});

test.describe('Persistência local (localStorage)', function () {
  test('cadastro salvo aparece no contador ao revisitar a rota', async function ({ page }) {
    await interceptarViaCEP(page);
    await page.goto('/#/cadastro');

    await page.fill('#nome', 'João Pereira');
    await page.fill('#cpf', '39053344705'); // outro CPF numericamente válido
    await page.fill('#nascimento', '1985-01-10');
    await page.fill('#telefone', '11987654321');
    await page.fill('#email', 'joao@exemplo.com');
    await page.fill('#cep', '04567000');
    await page.locator('#cep').blur();
    await page.fill('#numero', '10');
    await page.selectOption('#projeto', 'qualquer');
    await page.check('#consentimento');
    await page.click('button[type="submit"]');
    await expect(page.locator('#confirmacao-envio')).toBeVisible();

    // Simula a "revisita" à rota de cadastro (equivalente a um novo
    // carregamento de página numa SPA, já que não existe reload real
    // por rota): navega para outra rota e volta.
    await page.click('a[data-rota="/"]');
    await page.click('a[data-rota="/cadastro"]');

    await expect(page.locator('#contador-voluntarios')).toBeVisible();
    await expect(page.locator('#contador-voluntarios [data-texto]')).toContainText('cadastro');
  });
});
