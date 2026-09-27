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
import { iniciarCadastro } from './validacao.js';
import { restaurarContadorVoluntarios } from './armazenamento.js';

const ROTAS = {
  '/': 'html/inicio.html',
  '/projetos': 'html/projetos.html',
  '/cadastro': 'html/cadastro.html',
};
const ROTA_PADRAO = '/';

// Numa navegação tradicional, o navegador troca o <title> da aba e
// devolve o foco para o topo do documento sozinho — dá pra perceber
// que "mudou de página" mesmo sem olhar pra tela. Numa SPA isso não
// acontece automaticamente: o hash muda, mas o documento é sempre o
// mesmo, então sem esse mapa de títulos e o gerenciamento de foco
// abaixo, quem usa leitor de tela não teria nenhum sinal de que a
// "página" mudou (WCAG 2.4.2 Titled, 2.4.3 Focus Order).
const TITULOS = {
  '/': 'Instituto Semear — Início',
  '/projetos': 'Instituto Semear — Projetos',
  '/cadastro': 'Instituto Semear — Seja voluntário',
};
const TITULO_PADRAO = 'Instituto Semear';

// Só movo o foco a partir da SEGUNDA renderização: no primeiro
// carregamento da página, o próprio navegador já cuida de posicionar
// o foco corretamente, e roubar o foco logo de cara atrapalharia,
// por exemplo, alguém chegando por um link com um hash específico.
let primeiraRenderizacao = true;

// Nem toda rota precisa de um passo extra depois de o HTML entrar na
// tela. "/projetos" precisa: o fragmento injetado traz só o <template>
// vazio, e é aqui que eu disparo a geração dos cartões a partir dos
// dados (ver componentes.js).
const INICIALIZAR_ROTA = {
  '/projetos': renderizarProjetos,
  // "/cadastro" precisa de dois passos: primeiro restaurar da tela o
  // que já está salvo no localStorage (histórico de cadastros deste
  // navegador), depois religar os listeners de validação/envio no
  // formulário recém-injetado.
  '/cadastro': function () {
    restaurarContadorVoluntarios();
    iniciarCadastro();
  },
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
  document.title = TITULOS[rota] || TITULO_PADRAO;

  // Move o foco para o título da nova rota — tabindex="-1" o torna
  // focável por script sem entrar na ordem normal de tabulação. Assim,
  // quem navega por teclado ou leitor de tela é levado direto para o
  // conteúdo novo, em vez de ficar "preso" no link do menu que acabou
  // de clicar (que já não existe mais na mesma posição depois da troca).
  if (!primeiraRenderizacao) {
    const titulo = document.querySelector('#conteudo-principal h1');
    if (titulo) {
      titulo.setAttribute('tabindex', '-1');
      titulo.focus();
    }
  }
  primeiraRenderizacao = false;

  const inicializar = INICIALIZAR_ROTA[rota];
  if (inicializar) {
    inicializar();
  }
}

export function iniciarRoteador() {
  window.addEventListener('hashchange', navegar);
  navegar(); // primeira renderização, ao carregar a página
}
