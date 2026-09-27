/**
 * router.js — roteamento da SPA via hash (#/...).
 *
 * Por que hash e não History API (pushState)? Rota por hash não exige
 * nenhuma configuração de servidor (o navegador nunca pede um recurso
 * novo ao trocar só o hash) e continua funcionando até abrindo o
 * arquivo direto do disco — coerente com o restante do projeto, que
 * não depende de build nem de back-end. O "roteamento SPA" aqui é: eu
 * NUNCA preciso interceptar cliques com event.preventDefault(), porque
 * um link para "#/rota" já não recarrega a página sozinho — a
 * interceptação acontece um passo depois, ouvindo o evento
 * "hashchange" que o navegador dispara toda vez que o hash muda
 * (por clique, botão voltar/avançar do navegador, ou hash alterado
 * programaticamente).
 */
import { renderizarRota } from './templates.js';
import { renderizarProjetos } from './componentes.js';

const ROTAS = {
  '/': 'html/inicio.html',
  '/projetos': 'html/projetos.html',
  '/cadastro': 'html/cadastro.html',
};
const ROTA_PADRAO = '/';

// Nem toda rota precisa de um passo extra depois de o HTML entrar na
// tela. "/projetos" precisa: o fragmento injetado traz só o <template>
// vazio, e é aqui que eu disparo a geração dos cartões a partir dos
// dados (ver componentes.js).
const INICIALIZAR_ROTA = {
  '/projetos': renderizarProjetos,
};

function rotaAtual() {
  const hash = window.location.hash.replace(/^#/, '');
  return ROTAS[hash] ? hash : ROTA_PADRAO;
}

function marcarLinkAtivo(rota) {
  document.querySelectorAll('[data-rota]').forEach(function (link) {
    if (link.getAttribute('data-rota') === rota) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

async function navegar() {
  const rota = rotaAtual();
  // Preciso esperar o fragmento terminar de entrar no DOM antes de
  // rodar qualquer inicialização específica da rota — senão
  // renderizarProjetos() procuraria #lista-projetos antes de ele
  // existir na página.
  await renderizarRota(ROTAS[rota]);
  marcarLinkAtivo(rota);
  window.scrollTo({ top: 0, behavior: 'instant' });

  const inicializar = INICIALIZAR_ROTA[rota];
  if (inicializar) {
    inicializar();
  }
}

export function iniciarRoteador() {
  window.addEventListener('hashchange', navegar);
  navegar(); // primeira renderização, ao carregar a página
}
