/**
 * componentes.js — sistema de templates para componentes repetidos.
 *
 * Diferente de templates.js (que busca um FRAGMENTO DE PÁGINA inteiro
 * via fetch + innerHTML), este módulo resolve outro problema: gerar
 * vários elementos parecidos — os cartões de projeto — a partir de uma
 * lista de dados, sem escrever a marcação de cada um à mão.
 *
 * A técnica usada é o elemento <template> do HTML5 + cloneNode(true):
 * o navegador nunca renderiza o conteúdo de um <template> sozinho
 * (fica "inerte" no DOM), então ele serve como um molde reutilizável.
 * Cada clone é uma cópia independente da árvore de nós, que eu
 * preencho com dados antes de anexar ao documento — ao contrário de
 * montar HTML por concatenação de strings, aqui não existe risco de
 * quebrar a marcação por causa de um caractere especial no dado (ex.:
 * "&", "<") nem custo de o navegador reanalisar (reparsear) HTML a
 * cada card.
 */

// Fonte dos dados: um array simples. Em uma versão futura poderia vir
// de uma API ou do armazenamento local — a função de renderização não
// muda, só a origem dos dados.
const projetos = [
  {
    id: 'alimenta-comunidade',
    titulo: 'Alimenta Comunidade',
    icone: 'M5 3v7a4 4 0 0 0 4 4v7M9 3v8M13 3v8M17 3c1.5 0 2 2 2 4s-.5 4-2 4v10',
    descricao: 'Banco de alimentos que recebe doações e monta cestas básicas entregues quinzenalmente a famílias cadastradas na região leste da cidade.',
    horario: '📅 Sábados, 8h–12h',
    local: '📍 Sede — Vila Esperança',
    publico: '👥 Famílias em vulnerabilidade',
    vagas: 12,
    statusVagas: 'sucesso',
  },
  {
    id: 'reforco-escolar',
    titulo: 'Reforço Escolar Solidário',
    icone: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z M8 8h8M8 11.5h8',
    descricao: 'Aulas de português e matemática para crianças de 7 a 12 anos, em turmas pequenas, com apoio de material didático próprio.',
    horario: '📅 Terças e quintas, 14h–16h',
    local: '📍 Escola Municipal Jardim Aurora',
    publico: '👥 Crianças de 7 a 12 anos',
    vagas: 6,
    statusVagas: 'aviso',
  },
  {
    id: 'oficina-de-oficios',
    titulo: 'Oficina de Ofícios',
    icone: 'M14.7 6.3a3 3 0 1 1-4.2 4.2L4 17v3h3l6.5-6.5a3 3 0 1 1 4.2-4.2l-3-3Z',
    descricao: 'Capacitação profissional gratuita em costura, marcenaria básica e informática para adultos em busca de recolocação no mercado.',
    horario: '📅 Segundas e quartas, 19h–21h',
    local: '📍 Centro Comunitário Vila Esperança',
    publico: '👥 Adultos a partir de 18 anos',
    vagas: 9,
    statusVagas: 'sucesso',
  },
  {
    id: 'visita-que-acolhe',
    titulo: 'Visita que Acolhe',
    icone: 'M12 20.5s-7.5-4.6-9.7-9.2C.7 7.9 2.6 4 6.4 4c2 0 3.4 1 4.6 2.5C12.2 5 13.6 4 15.6 4c3.8 0 5.7 3.9 4.1 7.3C17.5 15.9 12 20.5 12 20.5Z',
    descricao: 'Visitas semanais a idosos em situação de isolamento, com conversa, leitura e pequenos serviços de companhia.',
    horario: '📅 Domingos, 10h–12h',
    local: '📍 Bairros Vila Esperança e Jardim Aurora',
    publico: '👥 Pessoas idosas',
    vagas: 4,
    statusVagas: 'aviso',
  },
];

// Clona o <template>, preenche seus campos com os dados de UM projeto
// e devolve o fragmento pronto para ser anexado ao DOM.
function criarCartaoProjeto(modelo, item) {
  const fragmento = modelo.content.cloneNode(true);

  fragmento.querySelector('.projeto').id = item.id;
  fragmento.querySelector('[data-campo="icone"]').setAttribute('d', item.icone);
  fragmento.querySelector('[data-campo="titulo"]').textContent = item.titulo;
  fragmento.querySelector('[data-campo="descricao"]').textContent = item.descricao;

  const [horario, local, publico] = fragmento.querySelectorAll('.projeto-meta li');
  horario.textContent = item.horario;
  local.textContent = item.local;
  publico.textContent = item.publico;

  const etiqueta = fragmento.querySelector('[data-campo="etiqueta"]');
  etiqueta.textContent = item.vagas + ' vagas abertas';
  etiqueta.classList.add('etiqueta--' + item.statusVagas);

  return fragmento;
}

// Ponto de entrada chamado pelo roteador logo após a rota "/projetos"
// ser injetada em #conteudo-principal (ver router.js).
export function renderizarProjetos() {
  const modelo = document.getElementById('modelo-projeto');
  const lista = document.getElementById('lista-projetos');
  if (!modelo || !lista) return; // rota diferente montada — nada a fazer

  const grupo = document.createDocumentFragment();
  projetos.forEach(function (item) {
    grupo.appendChild(criarCartaoProjeto(modelo, item));
  });
  lista.appendChild(grupo);
}
