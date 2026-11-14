# AURA — estado da preparação para produção

## Preparação de publicação — 06/11/2026

Foi criado `docs/RELEASE_PLAN.md`, separando demonstração escolar, teste público e lançamento nas lojas. A página inicial passou a ter uma secção móvel configurável: sem listagens oficiais mostra apenas que as aplicações estão em preparação; os links só aparecem para URLs HTTPS válidos de Google Play ou App Store. Foram também retiradas da apresentação pública afirmações de terapeuta, acompanhamento médico, precisão clínica e efeitos instantâneos nos cinco idiomas, incluindo a app móvel. Os exercícios foram reescritos como adaptações educativas, ganharam avisos de segurança e as referências estão registadas em `docs/CONTENT_REFERENCES.md`. Os MP3 de origem não documentada deixaram de ser distribuídos e foram substituídos por ambientes procedurais originais aprovados.

Os atalhos inseguros de demonstração foram removidos da web e do mobile: já não existe token falso nem palavra-passe de demonstração no cliente. Foi acrescentado `AURA_SCHOOL_DEMO=true`, que impede chamadas ao Gemini no backend, um modelo de configuração em `backend/.env.school.example` e a verificação `npm run check:school-demo`. A apresentação deve usar uma conta Supabase dedicada com dados totalmente fictícios e palavra-passe mantida fora do repositório.

O chat passou a informar, antes da primeira mensagem e nos cinco idiomas, que as respostas são automáticas, podem estar erradas e não provêm de um profissional de saúde ou serviço de emergência. Foram também removidas das traduções restantes expressões como «avaliações clínicas» e «meditações baseadas em evidências», que não estavam sustentadas por uma validação formal do produto.

Foi gerado `docs/DEPENDENCY_LICENSES.md` e o inventário detalhado `docs/dependency-license-inventory.json` a partir dos lockfiles. Foram encontrados 995 pacotes/versões de produção e 75 dependências diretas. Nenhuma licença comercial precisa de ser comprada apenas para usar Next.js, React, Express ou Expo; 28 componentes transitivos com MPL, LGPL, CC-BY ou expressão alternativa ficaram corretamente sinalizados para cumprimento/revisão antes da distribuição final. O relatório pode ser repetido com `node scripts/audit-dependency-licenses.mjs`.

Foi também preparado `docs/THIRD_PARTY_NOTICES.md`, com pacote, versão, projeto e licença das 995 entradas, além das obrigações de atribuição e conservação a verificar no artefacto final. `docs/BRAND_ASSET_PROVENANCE.md` regista os hashes dos logótipos e a declaração do responsável de que foram gerados com IA. Ainda é necessário identificar a ferramenta/plano e confirmar os respetivos termos; até lá, os elementos visuais permanecem corretamente bloqueados para publicação pública.

Foi acrescentado o gate `npm run check:release`, separado do modo escolar. Após a aprovação dos novos ambientes de áudio, ele valida 29 condições e mantém corretamente a publicação bloqueada: 7 estão aprovadas e 22 ainda dependem de configuração HTTPS, decisões do responsável, domínio/loja escolhida, finalização legal ou outros direitos de conteúdo. A condição de áudio está resolvida com ficheiros e hashes verificados; `docs/release-decisions.json` mantém decisões externas explicitamente vazias; `docs/INCIDENT_RESPONSE.md` fornece o procedimento operacional inicial. O gate nunca imprime os valores das chaves.

Foram gerados três ambientes de áudio originais, sem voz nem amostras de terceiros. Após a rejeição dos primeiros candidatos tonais, o gerador passou a produzir chuva suave, água/cachoeira distante e vento de floresta com white, pink e brown noise filtrados. São loops WAV de 30 segundos, com cerca de 1,44 MB cada. Em 14/11/2026, o responsável aprovou-os e autorizou a instalação em `frontend/public/audio` e `mobile/assets/audio`. `scripts/validate-audio-candidates.mjs` confirmou formato PCM, duração, hashes, amplitude sem clipping, offset DC baixo e continuidade da repetição; `docs/content-rights.json` verifica os hashes das seis cópias distribuídas. Os MP3 de origem desconhecida permanecem apenas em `tmp/aura-audio-quarantine` e não são referenciados pelo código. A proveniência está em `docs/AUDIO_PROVENANCE.md`.

Foi criado `START_SCHOOL_DEMO.bat` e o guião `docs/SCHOOL_DEMO_RUNBOOK.md`. O lançador força o bloqueio do Gemini no processo, sem alterar o `.env`; `check-local --school-demo` confirmou API, build standalone, ficheiros estáticos, páginas legais, CORS e ausência dos áudios em quarentena. Em Windows, os PIDs criados ficam num estado temporário e `STOP_AURA.bat` encerra apenas essa execução. Foram validados tanto o encerramento explícito como a limpeza automática dos filhos quando o processo pai desaparece; as portas 3000 e 8000 ficaram livres.

Em 14/11/2026 foi novamente preparada e verificada uma cópia limpa do código em `tmp/aura-release`. O manifesto contém 260 ficheiros, incluindo as seis cópias WAV aprovadas para web/mobile. Tanto o verificador do projeto como a cópia autónoma do verificador confirmaram o manifesto e a ausência de ambientes privados, valores de chaves configuradas, histórico Git, dados locais, dependências instaladas, builds e áudios em quarentena. A pasta tem ainda `SOURCE_RELEASE_NOTICE.md`, que deixa explícito que a validação técnica não substitui o gate público. O envio para um repositório privado novo continua pendente e exige a conta/decisão do utilizador.

> Prioridade confirmada pelo utilizador: projeto de PAP em desenvolvimento. Completar e estabilizar web, mobile e backend; adiar a publicação até o professor disponibilizar domínio e licenças. O mobile é testado num telemóvel físico através do Expo Go. Os passos de publicação abaixo são preparação futura, não ações a executar agora. Ver `docs/PROJECT_CONTEXT.md` e o modo Expo Go em `docs/SETUP.md`.

## Progresso na web e no mobile — 01/11/2026

Progresso passou a reunir Visão geral, O meu percurso e Relatórios. Foram acrescentados histórico pesquisável, detalhes dos inquéritos, edição de reflexões, práticas de meditação persistentes e snapshots de relatórios que podem ser reabertos nas duas aplicações. A migração `20261101_progress.sql` foi confirmada pelo utilizador e validada com contas temporárias no Supabase. Ver [PROGRESS.md](PROGRESS.md) para implementação, testes e limites da validação visual/Expo Go.

## Implementado em 26/10/2026

- As rotas de humor, sono, reflexões, conversas e avaliações exigem um token validado e recusam IDs de outros utilizadores. O cliente Supabase de dados usa o token do pedido, para aplicar também RLS.
- Logs, sono, reflexões, avaliações, conversas e preferências passam a usar Supabase. Falhas de persistência devolvem erro; não existe fallback silencioso para JSON.
- O perfil grava nos metadados do Supabase Auth. As preferências são carregadas e gravadas no servidor, incluindo reposição dos valores predefinidos. O ecrã de sono do mobile e da web grava pela API.
- Renovação de sessão na web e no mobile, com uma única renovação para pedidos simultâneos, repetição limitada a uma tentativa e conservação da sessão durante falhas de rede. Os refresh tokens são removidos ao sair.
- Cadastro sem sessão exige confirmação por e-mail. Recuperação inclui envio de link e página `/reset-password` para guardar a nova palavra-passe.
- Eliminação chama Supabase Auth Admin, verifica a versão da migração e usa um trigger transacional para remover os dados associados. Os ficheiros legados deste servidor também são limpos. Exportação inclui conversas e preferências, sem o hash interno do token.
- `/account` redireciona para `/settings`; a chamada órfã a `/reports/generate` foi removida. Os ecrãs de relatórios usam logs e avaliações, tratam erros, ordenam cronologicamente e não contam logs como meditações.
- Painéis e sono deixam de inventar medições para dias sem dados. O dashboard mobile atualiza ao regressar ao separador; a web recebe eventos de alteração de dados. O catálogo de meditações mobile lê os metadados do backend; a reprodução dos antigos MP3 foi posteriormente desativada por falta de proveniência.
- Áudio iOS em segundo plano declarado no projeto nativo. Lembretes locais são opcionais, configuráveis e cancelados ao sair; a rotina não apaga notificações de outras funcionalidades.
- O lembrete diário móvel volta a validar permissões e o canal Android ao ser configurado, é restaurado com segurança ao abrir a sessão, acompanha o idioma guardado e tem um botão de teste que agenda uma notificação local em poucos segundos. As opções web de relatório semanal, sequência e e-mails continuam apenas como preferências guardadas e não devem ser apresentadas como serviços de envio implementados.
- Links de privacidade e termos e aviso de finalidade de bem-estar. Os textos legais são **rascunhos**, não documentos finais de lançamento.

## Ativação obrigatória antes de executar esta versão com dados reais

1. Parar os processos antigos que escrevem JSON e fazer uma cópia de segurança de `backend/data` e da base de dados.
2. Inspecionar o esquema Supabase. Esta migração usa a base de `backend/schema.sql`, com `users.id TEXT`. O ficheiro antigo `20260315_settings_account_system.sql` descreve uma alternativa com UUID e não deve ser aplicado indiscriminadamente. A migração nova recusa essa alternativa para evitar alterações incompatíveis. Numa instalação nova, aplicar `schema.sql` primeiro; numa existente, não voltar a executar as suas políticas sem inspeção.
3. Aplicar `src/db/migrations/20261026_durable_wellness.sql` no SQL Editor do Supabase. Inclui tabelas de sono/reflexões/preferências, funções atómicas e políticas RLS. A tabela `app_settings` é usada porque o esquema antigo de `user_settings` depende da alternativa UUID.
4. `S_URL`, `S_ANON` e **`S_SERV` estão configurados e o acesso administrativo foi validado**. `S_SERV` existe apenas no backend. `DATABASE_URL` não é necessário para o fluxo atual via REST/SQL Editor. Nunca colocar a chave de serviço em variáveis `NEXT_PUBLIC_*` ou `EXPO_PUBLIC_*`.
5. Importação executada com `node --use-system-ca scripts/import-legacy-data.js --apply --skip-unlinked`: **2 logs diários, 1 registo de sono e 16 mensagens de conversa**, de um proprietário validado no Supabase Auth. Os logs diários respeitam a regra existente de um registo por utilizador/dia. Uma repetição inseriu zero registos adicionais. Foram verificadas as identidades de destino de todos os registos processados; os conteúdos originais foram preservados localmente. A opção `--skip-unlinked` é explícita: mantém fora da importação os dados de um proprietário sem identificador Supabase válido, sem os eliminar nem reatribuir. Sem essa opção, o importador recusa avançar quando encontra proprietários não associáveis. Gerir cópias de segurança e servidores antigos segundo a política final de conservação.

   Os ficheiros JSON existentes de `backend/data` já estão versionados no Git. A regra nova de `.gitignore` impede novos ficheiros, mas não remove os ficheiros nem o histórico existente. Rever e retirar esses dados do controlo de versões após a cópia/importação, sem eliminar os únicos originais antes de verificar a migração.
6. Os registos antigos guardados **só no armazenamento local dos browsers/telemóveis** não têm proprietário verificável no formato antigo. Não são atribuídos automaticamente à próxima conta que iniciar sessão. Preservar e rever esses dados no respetivo dispositivo antes de limpar o armazenamento. Não são cobertos pelo importador de `backend/data`.
7. Configurar `PASSWORD_RESET_URL`. Neste computador, usar `http://127.0.0.1:3000/reset-password`, porque o preview integrado não encaminha corretamente `localhost`; autorizar exatamente esse destino na lista de redirect URLs do Supabase Auth. Endereço previsto para produção: `https://aura.pt/reset-password`. O fluxo atual usa o link de recuperação com fragmento de sessão do Supabase; não usa PKCE.
8. Configurar `NODE_ENV=production`, `CORS_ORIGINS=https://aura.pt` e os URLs públicos HTTPS de web/backend. `aura.pt` é um domínio **previsto**, sem registo, propriedade ou publicação verificados nesta sessão.
9. Na web, preencher `AURA_LEGAL_ENTITY` e `NEXT_PUBLIC_SUPPORT_EMAIL`. Finalizar a política: base jurídica, tratamento de dados de saúde, consentimento/partilha com Gemini, conservação, backups, regiões e transferências, direitos, idade e contacto. Não publicar os rascunhos como política aprovada.
10. No mobile, configurar `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_WEB_URL`. A configuração EAS de produção recusa URLs sem HTTPS. A app não usa a chave de proprietário que estava embutida no cliente antigo.

## Verificações e limites

### Revisão web em 28/10/2026

Corrigidos os cálculos semanais e a sequência de registos nos relatórios, a validação/períodos de sono e o comportamento da exportação quando a janela é bloqueada. Retirada a chave fixa do utilitário antigo de encriptação, com recusa de operações sem configuração adequada. Foram aprovados 43 testes locais e as nove verificações no Supabase real; os ficheiros frontend alterados passaram no lint sem avisos. O teste visual completo está pendente devido ao bloqueio técnico do controlo do navegador. Ver [WEB_REVIEW.md](WEB_REVIEW.md) para evidência, limites e distinção entre encriptação do fornecedor e proteção adicional dos campos. Os números de 26/10 abaixo descrevem a validação dessa data.

### Avanço em 26/10/2026: contacto, Gemini e verificação da migração

- Contacto autorizado pelo utilizador: **leogoncales07@gmail.com**. Foi configurado em `frontend/.env.local` e no exemplo de configuração; a build web confirmou a sua presença em `/privacy` e `/terms`. Responsáveis confirmados: **Leonardo Pierre Gonçales e Matheus Esaka Silva**, configurados em `AURA_LEGAL_ENTITY`. Os textos continuam como rascunho até à revisão dos restantes pontos legais.
- Configurados localmente `PASSWORD_RESET_URL=http://127.0.0.1:3000/reset-password`, CORS para `localhost` e `127.0.0.1`, e `GEMINI_MODEL=gemini-2.5-flash`. O mobile recebeu o URL web de desenvolvimento correspondente ao anfitrião da sua API. Estes URLs locais não representam um deploy nem a autorização dos redirecionamentos no painel Supabase.
- Criada cópia de segurança dos quatro JSON existentes em `tmp/aura-backups`, com manifesto e verificação SHA-256. A pasta está excluída do Git. Os originais foram preservados.
- Após o utilizador executar a migração no SQL Editor e confirmar `Success`, a verificação remota sem ler registos confirmou HTTP 200 nas sete tabelas: `users`, `daily_logs`, `assessments`, `conversations`, `sleep_logs`, `reflections` e `app_settings`. Antes da execução, as três tabelas novas respondiam `PGRST205`. A migração e a importação dos registos com proprietário válido foram concluídas. `S_SERV` foi configurado pelo utilizador e validado com a API administrativa. `DATABASE_URL` pode continuar ausente para este fluxo via Supabase REST e SQL Editor.
- A chave Gemini existente respondeu com sucesso ao modelo `gemini-2.5-flash`. O teste usou apenas o texto sintético "Return only the word OK.", com **7 tokens de entrada e 1 de saída**, sem dados pessoais. O teste não permite determinar o escalão de faturacão nem a capacidade total do projeto.
- Transporte Gemini centralizado: chave no cabeçalho em vez do URL, timeout de 20 segundos, respostas curtas limitadas a 512 tokens nos controladores e tratamento de quota esgotada. O modelo pode ser configurado por variável de ambiente. Os registos de diagnóstico não incluem prompts, respostas nem a chave.
- Para disponibilizar a AURA a utilizadores em Portugal/EEE, verificar a ativação do serviço pago Gemini: os [termos em vigor](https://ai.google.dev/gemini-api/terms) exigem Paid Services para clientes disponibilizados no EEE, Suíça ou Reino Unido. As [quotas](https://ai.google.dev/gemini-api/docs/rate-limits) são aplicadas ao projeto; criar outra chave no mesmo projeto não aumenta a capacidade. Não foi ativada faturacão nesta sessão.
- Um proprietário dos JSON de conversas tem um identificador sem formato UUID Supabase. Esses registos ficaram excluídos pela opção explícita `--skip-unlinked`, preservados no original e no backup. Resolver a propriedade antes de os importar; não atribuir automaticamente à conta de outra pessoa.

Comandos de diagnóstico:

```sh
# Configuração local; não mostra valores secretos.
npm run check:production
# Verifica tabelas com limit=0 e disponibilidade do modelo, sem ler dados pessoais.
npm run check:production -- --remote
# Opcional: uma geração sintética pequena para confirmar acesso efetivo.
npm run check:production -- --remote --generate
npm run backup:legacy
```

Os testes de base de dados usam um pacote isolado. Os comandos desta secção são executados a partir de `backend/`:

```sh
npm ci --prefix tests/database --ignore-scripts
npm run test:database
```

Resultado: **27 testes de API/clientes/Gemini + 6 testes SQL aprovados**. Os seis testes SQL executam o esquema e a migração reais em PostgreSQL PGlite, com duas identidades sintéticas e funções JWT simuladas. Cobrem reaplicação, backfill e criação de perfil, atomicidade de sono/humor, RLS, preferências e eliminação por trigger. Validam o SQL localmente; a validação adicional no Supabase Auth/PostgREST real está descrita abaixo.

`npm test` em `backend`: testes HTTP com Supabase simulado e testes dos clientes web/mobile, incluindo acesso indevido, falhas de gravação, exportação, eliminação e renovação concorrente. Estes testes não certificam as políticas SQL nem fazem operações em contas reais.

Resultado acumulado: **33 testes aprovados**, build Next.js 15.5.28 aprovada, exportação do bundle Android aprovada na etapa anterior e lint dos ficheiros alterados sem erros (com avisos de hooks/variáveis por resolver). Em Windows, usar `npm.cmd` quando a política PowerShell bloquear `npm.ps1`; para fontes Google atrás de certificados empresariais, `node --use-system-ca node_modules/next/dist/bin/next build`.

### Validação no Supabase real após configurar S_SERV

`node --use-system-ca scripts/verify-live-flow.js --run` concluiu nove verificações usando o backend Express e o Supabase real. O script criou duas contas temporárias identificadas pelo UUID desta execução, sem envio de e-mails e com Gemini desativado apenas no processo de teste. Não alterou contas existentes.

Foram validados: criação de perfil por trigger; login; gravação de humor, sono, reflexão, conversa e avaliação; persistência de perfil/preferências; rejeição de acesso entre contas pela API e pelas políticas RLS; exportação completa; renovação de sessão; eliminação apenas dos dados de bem-estar sem apagar a conta; e eliminação efetiva de uma conta no Auth, cascata das tabelas e rejeição do token eliminado. A outra conta permaneceu acessível durante a validação. Todas as contas temporárias foram eliminadas e essa eliminação foi confirmada.

Uma segunda execução do importador encontrou os mesmos **20 registos de destino** (incluindo o perfil já existente) e inseriu **zero** registos adicionais. Os quatro JSON locais mantêm-se preservados; há nova cópia em `tmp/aura-backups/2026-10-26T18-43-35-213Z`.

### Preparação de publicação e recuperação por e-mail

O utilizador confirmou **«Recebi e consegui alterar»** após o pedido de recuperação enviado para o contacto autorizado. A página local respondeu HTTP 200 e o Supabase aceitou o envio. A recuperação por e-mail foi validada neste computador; deve ser repetida depois de configurar os URLs HTTPS finais e o SMTP de produção.

O domínio `aura.pt` ainda não foi registado e não existe uma conta de alojamento. Foram preparados `docs/SETUP.md`, Dockerfiles separados, `compose.local.yaml`, exemplos de ambiente de produção e um lançador local Node que substitui o arranque antigo em Python. Docker não está instalado, pelo que as imagens não foram construídas. A build Next standalone foi iniciada e verificada diretamente, incluindo CSS/JS, áudio, identidade/contacto das páginas legais e CORS.

Next.js e eslint-config-next foram atualizados de 15.1.7 para 15.5.28. As auditorias de produção de web e backend reportaram **zero vulnerabilidades conhecidas** após corrigir PostCSS, parsers e restantes dependências assinaladas. Isso é o resultado da auditoria nessa data, não uma garantia de ausência de vulnerabilidades. O Zod foi atualizado para 4.6.7, com os 33 testes e a validação real no Supabase aprovados. BullMQ e bcrypt foram retirados do backend Node por não serem usados; o lockfile foi sincronizado, removendo também a árvore Expo antiga que tinha ficado presa no lockfile do backend.

Foram acrescentados `/health`, suporte explícito a proxies de confiança por número de saltos e shutdown de pedidos em curso. Redis só tenta ligar quando `REDIS_URL` está definido. A preparação de uma cópia de código para publicação exclui ficheiros privados, dados legados e histórico Git e verifica a ausência dos valores das chaves configuradas.

**A migração, a importação dos registos com proprietário válido, a validação do backend no Supabase real e a recuperação por e-mail local foram concluídas.** Continuam pendentes: resolver os registos legados sem proprietário associável; confirmar a recuperação após expiração nas interfaces; criar/selecionar o alojamento, configurar os URLs HTTPS e SMTP de produção e finalizar os textos legais. Só depois executar `eas build --platform android --profile production`. Testar áudio com ecrã bloqueado, permissões e lembretes num dispositivo físico e numa build nativa; o Expo Go não substitui esse teste.

Não foram publicados web/backend nem enviada build às lojas. Os endpoints antigos de avatar, sessões, 2FA e integrações ainda dependem de PostgreSQL/Redis/esquemas anteriores e precisam de revisão separada; os controlos que simulavam 2FA, ligações a contas externas e desativação foram retirados das definições web. Relatórios com análise mensal Gemini e medição real de sessões de meditação continuam pendentes. A seleção de conservação fictícia foi retirada; a política de conservação final ainda precisa de implementação.

Referências de implementação: [Supabase: cliente Auth no servidor](https://supabase.com/docs/reference/javascript/auth), [recuperação de palavra-passe](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [eliminação de utilizadores](https://supabase.com/docs/guides/auth/managing-user-data), [Next.js 15: ESLint](https://nextjs.org/docs/15/app/api-reference/config/eslint), [Apple: execução de áudio em segundo plano](https://developer.apple.com/documentation/xcode/configuring-background-execution-modes).
