# AURA — web

Aplicação Next.js. As páginas ficam em `src/app/`, os componentes em `src/components/`, a sessão e o tema em `src/context/`, o cliente da API em `src/lib/api.js` e as traduções em `src/i18n/`. Os ficheiros públicos, incluindo áudios, ficam em `public/`.

Para desenvolver, iniciar a API noutro terminal com `npm.cmd --prefix backend run dev`, a partir da raiz. Depois, nesta pasta:

```sh
npm ci
npm run dev
```

A web abre em `http://localhost:3000`. Não executar em simultâneo com o lançador que já ocupa essa porta.

Para atualizar a build utilizada por `START_APP.bat` e `START_MOBILE.bat`, executar `npm run build` nesta pasta. O script prepara também os ficheiros estáticos da versão standalone. `.next/` é gerada e não deve ser editada.

As definições privadas locais ficam em `.env.local`; há exemplos sem chaves para novas instalações. Consultar [instalação e testes](../docs/SETUP.md). A publicação está adiada.
