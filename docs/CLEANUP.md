# Limpeza e organização — 26/10/2026

A estrutura ativa passa a ser `backend/` (Node.js), `frontend/` (Next.js), `mobile/` (Expo), `scripts/` e `docs/`. O ponto de entrada da documentação é o `README.md` da raiz.

Foram retirados 87 ficheiros obsoletos ou sem utilização: backend e diagnósticos Python, lançadores antigos, resultados/logs de testes, correções pontuais já aplicadas, exemplos Next/Expo, CSS da antiga página de conta, uma configuração de IDE que apontava para o ambiente Python antigo e uma imagem duplicada com o mesmo SHA-256. Foi removido também o ambiente Python `.venv`, o seu cache e duas cópias geradas de código para publicação, que podem ser recriadas.

Os documentos antes chamados `DEPLOYMENT.md`, `PROJECT_CONTEXT.md` e `backend/PRODUCTION_READINESS.md` estão agora em `docs/SETUP.md`, `docs/PROJECT_CONTEXT.md` e `docs/PROJECT_STATUS.md`. Os READMEs genéricos foram substituídos por instruções específicas da AURA. `AURA.code-workspace` abre a raiz inteira do projeto.

Foram preservados os `.env`, os JSON legados, os backups dos dados, as migrações SQL, os testes atuais, as dependências instaladas, a build web e a pasta Android local. Os áudios de web e mobile permanecem em ambas as aplicações porque cada uma os empacota/serve de forma diferente.

## Recuperação local

Antes da remoção foi criada `tmp/aura-cleanup/2026-10-26T20-02-07/removed-files.zip`, com os ficheiros retirados e as versões anteriores dos documentos movidos. O `manifest.json` da mesma pasta regista caminhos, tamanhos e hashes. Para recuperar algum ficheiro, extrair a entrada pretendida para uma pasta temporária e rever o seu conteúdo antes de o repor.

Essa cópia está excluída do Git e pode conter diagnósticos antigos com dados privados. Não a incluir nas entregas da PAP. O ambiente Python e as cópias geradas para publicação não foram incluídos no ZIP; o código e a lista antiga de dependências Python foram preservados.

A limpeza da árvore local não remove ficheiros já existentes no histórico Git. Os JSON legados já versionados continuam a exigir a revisão de privacidade indicada em `PROJECT_STATUS.md` antes de partilhar o repositório.

## Verificação após a limpeza

- 33 testes locais aprovados, incluindo os seis testes SQL.
- Build Next.js e preparação standalone aprovadas; exportação do bundle Android aprovada.
- Arranque local verificado: API, login, ficheiros estáticos, áudio, páginas legais e CORS. As rotas de demonstração removidas devolvem 404.
- Os sete ficheiros protegidos (três de ambiente e quatro JSON de dados) mantiveram os hashes originais. A cópia de recuperação foi verificada por SHA-256.
- Referências de documentação e caminhos usados na preparação de cópias de código verificados. Os processos de verificação foram terminados; não foi efetuada publicação nem teste nativo no telemóvel nesta limpeza.
