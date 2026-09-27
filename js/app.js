/**
 * app.js — ponto de entrada da SPA (Single Page Application).
 *
 * Responsabilidade: inicializar os demais módulos quando o documento
 * estiver pronto. Cada módulo cuida de UMA área de funcionalidade
 * (separação de responsabilidades também no JavaScript, não só nas
 * pastas):
 *   - router.js           → navegação entre rotas via hash (já funcional)
 *   - templates.js        → carregar/renderizar os fragmentos de html/ (já funcional)
 *   - validacao.js        → validação do formulário de cadastro (próxima etapa)
 *   - armazenamento.js    → persistência dos cadastros via localStorage (próxima etapa)
 *   - menu.js             → alternância do menu mobile (já funcional, reaproveitado
 *                            do projeto estático)
 *
 * Por ser um módulo ES (type="module" no <script> do index.html), este
 * arquivo já roda em modo estrito e com escopo próprio — sem precisar
 * de uma IIFE manual como no projeto estático anterior.
 */
import './menu.js';
import { iniciarRoteador } from './router.js';

document.addEventListener('DOMContentLoaded', function () {
  console.info('[Instituto Semear SPA] Arquitetura de pastas e módulos carregada.');
  iniciarRoteador();
});
