# Progress na web e no mobile — 01/11/2026

O separador Progresso reúne três vistas, sem acrescentar outra entrada à navegação:

- **Visão geral:** humor da semana, dias ativos do mês, sono médio, práticas concluídas, sequência diária e histórico de pontuações por questionário.
- **O meu percurso:** registos de humor/sono, reflexões, inquéritos e meditações concluídas. Permite pesquisar, filtrar por tipo e data e abrir os detalhes. As reflexões podem ser editadas ou eliminadas com confirmação; os resultados dos inquéritos mantêm as respostas e a análise originalmente guardadas.
- **Relatórios:** pré-visualização mensal calculada no servidor, gravação de um snapshot e reabertura na web ou no mobile. A web imprime/guarda PDF e o mobile usa o diálogo de partilha do PDF. Os metadados das exportações locais anteriores continuam visíveis; ficheiros PDF antigos do mobile podem ser abertos enquanto ainda existirem no cache.

## Dados e segurança

Aplicar `backend/src/db/migrations/20261101_progress.sql` depois da migração de 26/10. O utilizador confirmou Success e a validação remota verificou as novas tabelas/políticas. A migração é reaplicável e não remove os registos existentes.

`meditation_sessions` guarda práticas concluídas e `wellness_reports` guarda snapshots mensais. Ambas têm RLS, ligação ao perfil com eliminação em cascata e políticas para ler, inserir e eliminar apenas os registos da própria conta. A migração acrescenta o idioma aos novos inquéritos. Exportação, eliminação dos dados e eliminação da conta abrangem os novos registos.

Os endpoints `/progress` usam o token do utilizador e o cliente Supabase com esse token. O servidor gera o conteúdo do relatório a partir dos dados guardados. IDs de operação são reutilizados em novas tentativas, para não duplicar uma prática ou relatório quando uma resposta se perde na rede. No mobile, os IDs são atribuídos por `/progress/record-id`; não é necessário um módulo nativo de criptografia.

As datas SQL `DATE` são preservadas. Os timestamps são agrupados no fuso do dispositivo. O sono médio usa uma medição por dia, com os registos de sono disponíveis mesmo quando não existe registo de humor. Dias em falta mantêm ausência de dados; são necessários quatro dias com humor para calcular a diferença entre as duas metades do período. Os inquéritos são comparados individualmente, sem misturar escalas diferentes.

## Práticas e partilha de código

As duas aplicações permitem escolher 1, 3, 5 ou 10 minutos. Pausas e períodos de carregamento de áudio não contam para a prática. No mobile, o tempo de áudio vem do estado da reprodução; exercícios sem áudio são pausados quando a app passa para segundo plano. A gravação ocorre ao concluir, com mensagem de erro e nova tentativa caso a API esteja indisponível.

Os padrões 4-4-4-4 e 4-7-8 são distintos. Exercícios de relaxamento não apresentam a sequência respiratória de outro exercício. No mobile, os áudios continuam a ser assets incluídos no projeto, compatíveis com o fluxo Expo Go existente.

`mobile/lib/progress-utils.mjs` reutiliza as funções puras de `frontend/src/lib/`: traduções, datas, métricas, modelo HTML dos relatórios e temporização. `mobile/metro.config.js` permite ao Metro ler essa pasta. Manter a estrutura do repositório ao preparar o mobile. A cópia de código de `scripts/prepare-release.mjs` inclui a configuração Metro e ambas as aplicações.

## Validação

- 51 testes locais do backend, clientes, métricas e PostgreSQL aprovados. Incluem privacidade/RLS, snapshots imutáveis, tentativas repetidas, validação de duração, datas/fusos, pausas e texto seguro na exportação HTML.
- Dez verificações no Supabase real aprovadas com contas temporárias: criação/login, dados, edição de reflexão, histórico, meditação idempotente, snapshot, isolamento, exportação, renovação e eliminação. As contas temporárias foram eliminadas e a limpeza foi confirmada; Gemini ficou desativado nesse teste.
- Lint dos ficheiros alterados e TypeScript da web aprovados. No sandbox Windows, o lint do mobile usa `import/no-unresolved` com `caseSensitive: false`, mantendo a resolução ativa sem enumerar pastas privadas acima do workspace.
- Compilação de produção Next.js concluída numa cópia isolada para preservar o servidor de desenvolvimento. A cópia standalone assinalou uma restrição de criação de symlinks no Windows; o empacotamento Docker/standalone final não foi certificado por esse teste.
- Exportação Android do Expo aprovada. Isto valida código e assets, mas não comprova a execução dos módulos nativos no telefone. O utilizador encontrou um erro `ExpoCrypto` no primeiro teste: a dependência foi removida e a atribuição de IDs passou para o backend.
- O utilizador confirmou que a página web Progresso abre. A inspeção visual automatizada terminou porque o controlo do navegador não conseguiu verificar o URL atual com confiança. Não foram executados cliques nesse navegador.
- Depois de remover ExpoCrypto, o utilizador confirmou que Progresso abre no Expo Go com as três vistas. A conclusão de uma prática, a gravação/reabertura e a partilha do PDF no telefone ainda precisam de um teste de utilização; a persistência e o isolamento já foram verificados pela API real.

## Teste no telefone

Reiniciar o Metro com `npm run start:go -- --clear` em `mobile`, reabrir o projeto no Expo Go e confirmar as três vistas em Progresso. Concluir uma prática de um minuto, abrir a entrada no percurso, guardar um relatório e abri-lo também na web com a mesma conta. Verificar os detalhes de um inquérito, edição de reflexão e exportação PDF. Testar áudio em segundo plano posteriormente na build nativa própria.

Esta alteração não publica a aplicação nem gera diagnósticos ou uma nova análise mensal com IA.
