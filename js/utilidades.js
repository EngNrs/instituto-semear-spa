/**
 * utilidades.js — único ponto de contato com a biblioteca externa
 * Day.js (carregada via CDN em index.html, ver comentário lá).
 *
 * Por que Day.js? Cálculo/formatação de data em JS puro (Date nativo)
 * exige lidar manualmente com nomes de mês por extenso, fuso, plural
 * de "dia/dias" etc. — código chato e fácil de errar. Day.js resolve
 * isso em ~2KB, sem depender de um bundler: a build da CDN se registra
 * como uma variável global "dayjs", pronta pra usar assim que o script
 * carrega.
 *
 * Para não vazar esse acoplamento pelo resto da aplicação (e não haver
 * "conflito de escopo"), NENHUM outro módulo referencia "dayjs"
 * diretamente — só esta função. Se o script da CDN não carregar (sem
 * internet, CDN bloqueada, etc.), caio para Date + toLocaleString, que
 * é mais pobre mas nunca quebra a aplicação: a integração é uma
 * melhoria progressiva, não uma dependência obrigatória.
 */
export function formatarDataAmigavel(dataISO) {
  if (typeof dayjs === 'function') {
    dayjs.locale('pt-br');
    return dayjs(dataISO).format('D [de] MMMM [de] YYYY, [às] HH:mm');
  }
  console.info('[utilidades.js] Day.js indisponível; usando formatação nativa como alternativa.');
  return new Date(dataISO).toLocaleString('pt-BR');
}
