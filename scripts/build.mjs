#!/usr/bin/env node
/**
 * scripts/build.mjs — build de produção da SPA.
 *
 * Por que um script próprio em vez de Webpack/Vite? O projeto inteiro
 * foi desenhado para rodar SEM build em desenvolvimento (módulos ES
 * nativos, fetch() de fragmentos HTML) — decisão documentada em
 * js/router.js e no README. Adicionar aqui um bundler completo, com
 * seu próprio grafo de entradas/HTML processado, obrigaria a
 * reestruturar as pastas (ex.: mover html/ e imagens/ para "public/")
 * só para a build, quebrando esse fluxo simples de desenvolvimento.
 *
 * Em vez disso, uso o esbuild (o motor por trás do Vite) diretamente,
 * como *bundler*, não só "minificador": ele resolve estaticamente toda
 * a árvore de import/export a partir de js/app.js — app.js → menu.js +
 * router.js → templates.js + componentes.js + validacao.js +
 * armazenamento.js → utilidades.js — e concatena tudo num único
 * arquivo, já minificado. HTML (index.html e os fragmentos de rota) é
 * minificado à parte com html-minifier-terser, e imagens são copiadas
 * como estão (não há reamostragem de imagem neste passo).
 */
import { build } from 'esbuild';
import { minify as minifyHTML } from 'html-minifier-terser';
import { readFile, writeFile, mkdir, cp, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const DIST = path.join(RAIZ, 'dist');

const OPCOES_HTML = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true,
  // Nunca remover atributos "vazios" como `hidden` — html-minifier-terser
  // por padrão já preserva atributos boolean presentes no HTML de entrada
  // (ele só REMOVE quando o valor é redundante, ex. type="text/javascript"),
  // mas deixo explícito aqui por segurança: nenhum atributo boolean da
  // aplicação (hidden, required, disabled) depende de um valor específico.
  removeEmptyAttributes: false,
};

async function tamanho(caminho) {
  const info = await stat(caminho);
  return info.size;
}

async function minificarArquivoHTML(origemRelativa) {
  const origem = path.join(RAIZ, origemRelativa);
  const destino = path.join(DIST, origemRelativa);
  const bruto = await readFile(origem, 'utf8');
  const minificado = await minifyHTML(bruto, OPCOES_HTML);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, minificado, 'utf8');
  return { origem, antes: Buffer.byteLength(bruto), depois: Buffer.byteLength(minificado) };
}

async function main() {
  if (existsSync(DIST)) await rm(DIST, { recursive: true });
  await mkdir(DIST, { recursive: true });

  const relatorio = [];

  // 1) JS — bundle + minify de toda a árvore de módulos a partir de app.js
  const antesJS = await Promise.all(
    ['app.js', 'menu.js', 'router.js', 'templates.js', 'componentes.js', 'validacao.js', 'armazenamento.js', 'utilidades.js']
      .map((f) => tamanho(path.join(RAIZ, 'js', f)))
  );
  const somaAntesJS = antesJS.reduce((a, b) => a + b, 0);

  await mkdir(path.join(DIST, 'js'), { recursive: true });
  await build({
    entryPoints: [path.join(RAIZ, 'js/app.js')],
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2019',
    outfile: path.join(DIST, 'js/app.js'),
    legalComments: 'none',
  });
  const depoisJS = await tamanho(path.join(DIST, 'js/app.js'));
  relatorio.push({ nome: 'JS (8 módulos → 1 bundle)', antes: somaAntesJS, depois: depoisJS });

  // 2) CSS — minify (arquivo único, sem @import local para resolver)
  const cssOrigem = path.join(RAIZ, 'css/estilos.css');
  const antesCSS = await tamanho(cssOrigem);
  await mkdir(path.join(DIST, 'css'), { recursive: true });
  await build({
    entryPoints: [cssOrigem],
    minify: true,
    outfile: path.join(DIST, 'css/estilos.css'),
    legalComments: 'none',
  });
  const depoisCSS = await tamanho(path.join(DIST, 'css/estilos.css'));
  relatorio.push({ nome: 'CSS (estilos.css)', antes: antesCSS, depois: depoisCSS });

  // 3) HTML — index.html + os 3 fragmentos de rota
  for (const arquivo of ['index.html', 'html/inicio.html', 'html/projetos.html', 'html/cadastro.html']) {
    const r = await minificarArquivoHTML(arquivo);
    relatorio.push({ nome: `HTML (${arquivo})`, antes: r.antes, depois: r.depois });
  }

  // 4) Imagens — copiadas como estão (fora do escopo desta minificação)
  await cp(path.join(RAIZ, 'imagens'), path.join(DIST, 'imagens'), { recursive: true });

  // ---- Relatório ----
  const totalAntes = relatorio.reduce((a, r) => a + r.antes, 0);
  const totalDepois = relatorio.reduce((a, r) => a + r.depois, 0);
  console.log('\nBuild de produção gerada em dist/\n');
  console.log('Arquivo'.padEnd(28), 'Antes'.padStart(10), 'Depois'.padStart(10), 'Redução'.padStart(10));
  for (const r of relatorio) {
    const reducao = (100 * (1 - r.depois / r.antes)).toFixed(1) + '%';
    console.log(r.nome.padEnd(28), String(r.antes).padStart(10), String(r.depois).padStart(10), reducao.padStart(10));
  }
  const reducaoTotal = (100 * (1 - totalDepois / totalAntes)).toFixed(1) + '%';
  console.log('-'.repeat(60));
  console.log('TOTAL'.padEnd(28), String(totalAntes).padStart(10), String(totalDepois).padStart(10), reducaoTotal.padStart(10));
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
