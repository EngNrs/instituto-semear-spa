/**
 * menu.js — alterna o menu de navegação em telas estreitas.
 * Roda uma única vez, no carregamento da SPA, porque o cabeçalho
 * (e este botão) fazem parte do "casco" fixo em index.html — não são
 * recriados a cada troca de rota.
 */
(function () {
  const botao = document.querySelector('.botao-menu');
  const nav = document.getElementById('nav-principal');
  if (!botao || !nav) return;

  botao.addEventListener('click', function () {
    const aberto = botao.getAttribute('aria-expanded') === 'true';
    botao.setAttribute('aria-expanded', String(!aberto));
    if (aberto) {
      nav.setAttribute('hidden', '');
    } else {
      nav.removeAttribute('hidden');
    }
  });

  // Fecha o menu ao navegar (relevante em telas estreitas com o menu aberto)
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.matchMedia('(max-width: 780px)').matches) {
        botao.setAttribute('aria-expanded', 'false');
        nav.setAttribute('hidden', '');
      }
    });
  });
})();
