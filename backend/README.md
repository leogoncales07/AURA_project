# AURA — backend

API Node.js/Express utilizada pela web e pelo mobile. O arranque atual é `src/index.js`; o backend Python antigo foi retirado da árvore ativa.

- `src/routes/`, `src/controllers/`, `src/services/`: rotas, lógica dos pedidos e integrações.
- `src/db/`: ligação PostgreSQL e migrações SQL. `schema.sql` é a base do esquema atual; a migração de outubro de 2026 já foi aplicada neste projeto Supabase.
- `tests/`: testes HTTP/clientes/Gemini e testes SQL em `tests/database/`.
- `scripts/`: diagnóstico, backup, importação legada e validação remota explícita.
- `data/`: originais JSON preservados para migração/recuperação; não são o armazenamento da API atual.

O `.env` local contém as configurações privadas. Usar os exemplos apenas numa instalação nova. As funcionalidades migradas usam Supabase REST/Auth; Redis e uma ligação PostgreSQL direta não são necessários para esses fluxos.

Comandos nesta pasta:

```sh
npm ci
npm run dev
npm test
# Instalação isolada necessária uma vez para os testes SQL:
npm ci --prefix tests/database --ignore-scripts
npm run test:database
```

`npm run test:live` cria e elimina contas temporárias no Supabase real; não faz parte dos testes locais normais. A importação e a migração existentes não precisam de ser repetidas para iniciar a aplicação.

Consultar [instalação local](../docs/SETUP.md) e [estado/limites conhecidos](../docs/PROJECT_STATUS.md), incluindo os endpoints antigos de conta ainda pendentes de revisão.
