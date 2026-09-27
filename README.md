# Instituto Semear — SPA

Single Page Application (SPA) do Instituto Semear: apresentação institucional, catálogo de projetos sociais e formulário de cadastro de voluntários — tudo em uma única página HTML, sem back-end e sem etapa de build.

> Projeto didático, evolução de um site estático de 3 páginas para uma SPA com roteamento via hash, componentes gerados por `<template>`, validação de formulário com a Constraint Validation API e persistência local via `localStorage`.

## Sumário

- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como executar localmente](#como-executar-localmente)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Testes automatizados](#testes-automatizados)
- [Acessibilidade](#acessibilidade)
- [Versionamento e Git workflow](#versionamento-e-git-workflow)
- [Licença](#licença)

## Tecnologias utilizadas

| Categoria | Tecnologia |
|---|---|
| Marcação | HTML5 semântico (`<template>`, `<dialog>`-like padrões ARIA, `role`, `aria-*`) |
| Estilo | CSS3 (propriedades customizadas/variáveis, Flexbox, Grid, media queries) |
| Lógica | JavaScript ES2017+ nativo — **sem framework e sem bundler** — em módulos ES (`import`/`export`) |
| Roteamento | API de hash do navegador (`location.hash` + evento `hashchange`), sem back-end |
| Validação | Constraint Validation API (`checkValidity`, `validity`, evento `invalid`) + validadores customizados (CPF, DDD, CEP, idade) |
| Persistência | `localStorage` (Web Storage API), serializado em JSON |
| Biblioteca externa | [Day.js](https://day.js.org/) via CDN, com fallback nativo (`Date`/`toLocaleString`) caso a CDN não carregue |
| Testes | [Playwright](https://playwright.dev/) (`@playwright/test`) — testes end-to-end no navegador |
| Servidor de desenvolvimento | `python3 -m http.server` (qualquer servidor estático funciona) |

Não há transpilador, bundler (Webpack/Vite/etc.) nem preprocessador de CSS: o código enviado ao navegador é exatamente o código-fonte do repositório.

## Pré-requisitos

- Um navegador moderno com suporte a módulos ES (Chrome, Edge, Firefox ou Safari atualizados).
- **Python 3** (para o servidor de desenvolvimento) **ou** qualquer outro servidor HTTP estático de sua preferência.
  - Módulos ES exigem `http://`/`https://` — abrir `index.html` direto do disco (`file://`) falha por política de CORS do navegador.
- **Node.js 18+ e npm** — necessários apenas para rodar a suíte de testes automatizados; não são exigidos para simplesmente usar a aplicação.

## Instalação

```bash
git clone <url-do-repositório>
cd instituto-semear-spa

# Só é necessário se for rodar os testes automatizados (Playwright):
npm install
npx playwright install chromium   # baixa o navegador usado pelos testes (uma vez só)
```

A aplicação em si não tem dependências de produção — o `npm install` acima instala apenas a ferramenta de testes (`devDependencies`).

## Como executar localmente

```bash
npm start
# equivalente a: python3 -m http.server 8080
```

Depois, acesse **http://localhost:8080** no navegador. Não existe comando de build: HTML, CSS e JS são servidos como estão, sem etapa de compilação.

## Estrutura de pastas

```
instituto-semear-spa/
├── index.html          # casca fixa da SPA (cabeçalho, nav, rodapé) + ponto de montagem das rotas
├── css/
│   └── estilos.css     # todo o estilo da aplicação
├── html/                # fragmentos HTML injetados por rota (não são páginas completas)
│   ├── inicio.html
│   ├── projetos.html
│   └── cadastro.html
├── js/                  # módulos ES — um arquivo, uma responsabilidade
│   ├── app.js           # ponto de entrada, inicializa os demais módulos
│   ├── router.js        # roteamento via hash + título/foco por rota (a11y)
│   ├── templates.js      # injeta o fragmento HTML de cada rota
│   ├── componentes.js    # gera os cartões de projeto via <template> + cloneNode
│   ├── validacao.js      # máscaras, validação e envio do formulário de cadastro
│   ├── armazenamento.js  # camada de persistência (localStorage)
│   ├── utilidades.js     # integração com Day.js (com fallback nativo)
│   └── menu.js           # menu mobile (reaproveitado do site estático original)
├── imagens/
├── tests/
│   └── spa.spec.js     # testes end-to-end (Playwright)
├── scripts/
│   └── build.mjs        # build de produção (bundle + minificação)
├── playwright.config.js
├── playwright.build.config.js  # roda a mesma suíte contra dist/
└── package.json
```

## Testes automatizados

A suíte (Playwright) cobre os comportamentos mais sensíveis a regressão do projeto: roteamento + acessibilidade (título e foco por rota), navegação por teclado e foco visível, validação do formulário de cadastro e persistência via `localStorage`.

```bash
npm test
# equivalente a: playwright test
```

## Build de produção

O desenvolvimento continua sem build (ver "Como executar localmente"), mas para publicar a aplicação existe um passo opcional de otimização:

```bash
npm run build      # gera dist/ com JS empacotado+minificado, CSS e HTML minificados
npm run preview    # serve dist/ em http://localhost:8090 para conferir o resultado
npm run test:build # roda a MESMA suíte de testes apontando para dist/, não para o código-fonte
```

`scripts/build.mjs` usa o [esbuild](https://esbuild.github.io/) para resolver estaticamente a árvore de `import`/`export` a partir de `js/app.js` (8 módulos → 1 arquivo) e minificar o resultado, além de minificar `css/estilos.css` e os arquivos HTML com `html-minifier-terser`. Não usei Webpack/Vite porque ambos esperam processar `index.html` como ponto de entrada e mover assets estáticos para uma pasta `public/`, o que exigiria reestruturar `html/` e `imagens/` só por causa da build — o esbuild permite manter exatamente a mesma árvore de pastas em desenvolvimento e produção.

O próprio `playwright.config.js` sobe e derruba o servidor de desenvolvimento automaticamente durante a execução dos testes — não é preciso rodar `npm start` manualmente antes.

## Acessibilidade

O roteamento via hash não recarrega o documento, então o navegador nunca troca `document.title` nem reposiciona o foco sozinho como faria numa navegação tradicional. `js/router.js` compensa isso manualmente a cada troca de rota, atendendo:

- **WCAG 2.4.2 (Titled)** — `document.title` é atualizado para refletir a rota atual.
- **WCAG 2.4.3 (Focus Order)** — o foco é movido para o `<h1>` da nova rota após a primeira renderização, sem interferir no carregamento inicial da página.

## Versionamento e Git workflow

O projeto segue **GitFlow** (`main`, `develop`, `feature/*`, `hotfix/*`) e **Conventional Commits** (`feat`, `fix`, `chore`), com releases marcadas por tags anotadas seguindo **Semantic Versioning**:

- `v1.0.0` — primeira versão completa e funcional da SPA.
- `v1.0.1` — hotfix: atributo `hidden` ignorado em `.alerta` por conflito de cascata CSS.
- `v1.1.0` — feature: gerenciamento de título e foco nas trocas de rota (acessibilidade).

## Licença

Projeto de caráter didático, desenvolvido como parte de um desafio de curso. Uso livre para fins de estudo.
