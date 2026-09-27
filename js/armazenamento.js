/**
 * armazenamento.js — camada de persistência local dos cadastros de
 * voluntários via localStorage.
 *
 * Único módulo que toca localStorage.setItem/getItem diretamente — o
 * restante da aplicação (validacao.js) só chama as funções exportadas
 * aqui, sem saber que por baixo existe uma string em JSON. Isso
 * mantém o "contrato" simples: quem quer persistir dados só precisa
 * conhecer salvarVoluntario() e lerVoluntarios().
 */
import { formatarDataAmigavel } from './utilidades.js';

const CHAVE = 'institutoSemear:voluntarios';

// localStorage só guarda strings. Para salvar uma lista de objetos,
// preciso converter (JSON.stringify) antes de gravar e converter de
// volta (JSON.parse) toda vez que leio — nos dois sentidos, a
// aplicação sempre trabalha com array/objeto de verdade; só na
// fronteira com a API do navegador é que existe texto.
function lerVoluntarios() {
  const bruto = localStorage.getItem(CHAVE);
  if (!bruto) return [];
  try {
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    // Estrutura corrompida (ex.: alguém editou o localStorage manualmente
    // pelo DevTools) não pode derrubar o formulário — trato como se não
    // houvesse histórico ainda.
    console.error('[armazenamento.js] Dados salvos em formato inválido, ignorando.', erro);
    return [];
  }
}

function gravarVoluntarios(lista) {
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

// Acrescenta um novo cadastro à lista já salva e regrava tudo (o
// localStorage não tem "append": cada setItem substitui o valor
// inteiro daquela chave, por isso sempre leio, altero o array em
// memória e gravo de volta o array completo).
export function salvarVoluntario(dados) {
  const lista = lerVoluntarios();
  lista.push({
    ...dados,
    id: Date.now(),
    enviadoEm: new Date().toISOString(),
  });
  gravarVoluntarios(lista);
  return lista;
}

export function contarVoluntarios() {
  return lerVoluntarios().length;
}

// Restaura a interface com base no histórico salvo: chamada toda vez
// que a rota "/cadastro" é montada (equivalente, numa SPA, a um
// "carregamento inicial de página" — não existe um único load geral,
// cada rota tem o seu). Se já existem cadastros de sessões/visitas
// anteriores, mostra um aviso; senão, mantém o elemento oculto.
export function restaurarContadorVoluntarios() {
  const total = contarVoluntarios();
  const elemento = document.getElementById('contador-voluntarios');
  if (!elemento) return;
  if (total > 0) {
    const lista = lerVoluntarios();
    const ultimoEnvio = formatarDataAmigavel(lista[lista.length - 1].enviadoEm);
    elemento.querySelector('[data-texto]').textContent =
      (total === 1
        ? 'Você já tem 1 cadastro salvo neste navegador.'
        : `Você já tem ${total} cadastros salvos neste navegador.`) +
      ` Último em ${ultimoEnvio}.`;
    elemento.hidden = false;
  } else {
    elemento.hidden = true;
  }
}
