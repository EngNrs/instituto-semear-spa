/**
 * templates.js — busca e injeta o fragmento HTML da rota ativa dentro
 * de #conteudo-principal. É o único módulo que toca o innerHTML da
 * área de conteúdo — o router.js decide QUAL rota está ativa, mas
 * quem manipula o DOM de fato é sempre este arquivo.
 */

const conteudo = document.getElementById('conteudo-principal');

// Cache simples: evita um novo fetch() se o usuário voltar a uma rota
// já visitada nesta sessão da página.
const cache = new Map();

export async function renderizarRota(caminhoTemplate) {
  conteudo.setAttribute('aria-busy', 'true');
  try {
    let html = cache.get(caminhoTemplate);
    if (!html) {
      const resposta = await fetch(caminhoTemplate);
      if (!resposta.ok) {
        throw new Error('Template não encontrado: ' + caminhoTemplate);
      }
      html = await resposta.text();
      cache.set(caminhoTemplate, html);
    }
    conteudo.innerHTML = html;
  } catch (erro) {
    conteudo.innerHTML =
      '<section class="secao"><div class="envolucro">' +
      '<p>Não foi possível carregar esta página agora. Tente novamente em instantes.</p>' +
      '</div></section>';
    console.error('[templates.js]', erro);
  } finally {
    conteudo.removeAttribute('aria-busy');
  }
}
