# Revisão funcional da web — 28/10/2026

O objetivo é estabilizar a web para a PAP, sem publicar. O utilizador mantém backend e frontend a correr com `npm run dev`.

## Corrigido nesta revisão

- Relatórios: a média semanal considera apenas os registos da semana atual até hoje. A sequência conta dias consecutivos, sem confundir a quantidade de registos com a sequência. O total tem um contador separado. Dias sem humor registado não são tratados como medições de zero.
- Relatórios: falhas de leitura mostram erro e permitem nova tentativa. Uma mudança de mês ou de conta invalida pedidos anteriores, evitando apresentar resultados do mês anterior com o novo título. Um histórico local inválido não impede carregar os dados do servidor.
- Exportação: quando o navegador bloqueia a janela de impressão, a página mostra uma instrução e não acrescenta um falso registo ao histórico. A abertura da janela não comprova que o utilizador guardou efetivamente o PDF.
- Sono: validação estrita de horários, incluindo intervalos que atravessam a meia-noite. Horários iguais são ambíguos e não são interpretados automaticamente como 24 horas. Períodos sem registos mostram ausência de dados, sem recorrer a uma medição antiga nem a um horário fictício.
- Sono: os períodos são hoje, últimos 7/30/365 dias, incluindo hoje. A qualidade corresponde ao período selecionado. A atualização de um registo existente não duplica o seu ID no estado local. Os erros de gravação aparecem dentro do diálogo.
- Encriptação legada: retirada a chave fixa predefinida. As operações recusam funcionar sem uma chave explícita com pelo menos 32 caracteres, sem impedir o arranque dos fluxos principais. Foram mantidos o formato AES-256-GCM e a derivação para chaves fortes já configuradas. Tags incompletas e conteúdos alterados são recusados.

## Evidência e limites dos testes

- **43 testes locais aprovados**: 27 anteriores, 4 de encriptação, 6 de cálculos da web e 6 de PostgreSQL PGlite. Cobrem, entre outros casos, dados de semanas diferentes, intervalos de dias, duplicados, ausência de dados e diferenças de fuso horário.
- Lint dos três ficheiros frontend alterados sem erros nem avisos.
- Nove verificações no Supabase real aprovadas: contas temporárias/login, perfil, dados de bem-estar, preferências, isolamento entre contas/RLS, exportação, renovação, eliminação dos dados e eliminação da conta. O script usa exclusivamente contas temporárias marcadas e confirmou a limpeza. Gemini fica desativado apenas nesse processo de teste.
- `/health`, `/reports` e `/sleep` responderam HTTP 200 nos servidores locais, sem mensagens de erro de compilação. Estes pedidos verificam a resposta e a compilação; não validam interações autenticadas nem o aspeto visual.
- Não foi executada uma nova build de produção em paralelo com o servidor de desenvolvimento, porque ambos usam `.next/`.
- O navegador integrado está indisponível. O controlo nativo do Chrome foi interrompido por não conseguir confirmar o URL com segurança. A revisão visual completa está **pendente**, mesmo após o utilizador confirmar que abriu a AURA com sessão iniciada. Não foram automatizados cliques, formulários ou alterações nessa sessão.

## Encriptação: o que existe e o que falta decidir

O [Supabase documenta encriptação AES-256 em repouso e TLS em trânsito](https://supabase.com/security). O [Supabase Auth guarda hashes bcrypt das palavras-passe](https://supabase.com/docs/guides/auth/password-security); a AURA não deve guardar uma cópia recuperável dessas palavras-passe.

Os pedidos da API ao Supabase utilizam o URL HTTPS configurado. Os acessos locais web/mobile à API continuam em HTTP e não ficam protegidos por TLS só porque o Supabase usa HTTPS. HTTPS para esses acessos faz parte da futura configuração de publicação.

Os registos de humor, sono, reflexões e conversas **não têm encriptação adicional de campos nem encriptação de ponta a ponta na AURA**. Estão sujeitos às permissões da API e às políticas RLS. A encriptação do disco do fornecedor não impede uma consulta de alguém com permissões administrativas. Uma camada adicional exige definir quais campos proteger, onde guardar as chaves, como as rodar/recuperar e como tratar os dados necessários ao Gemini; não foi aplicada uma migração aos dados existentes.

`src/utils/crypto.js`, no backend, é o utilitário dos endpoints antigos de 2FA/integrações, não um mecanismo global de proteção dos dados. `ENCRYPTION_KEY` continua opcional para os fluxos principais e não foi criada nem modificada no `.env` local. Antes de reativar esses endpoints, configurar um segredo aleatório no servidor. Dados antigos eventualmente cifrados com uma chave fraca/predefinida precisam de uma migração controlada; não gerar uma chave nova esperando que leia esses dados.

As cópias JSON/ZIP locais não ganharam encriptação com esta correção. Preservar os backups e rever a presença de dados pessoais na árvore/histórico Git antes de partilhar o trabalho.

## Próxima validação visual

Usar uma conta de teste e conteúdo fictício para confirmar: entrada/saída, humor/sono e persistência após recarregar, avaliação e histórico, chat e falha de rede, reprodução de meditações, relatório/diálogo de impressão, perfil/preferências, teclado e ecrã estreito. Recuperação e eliminação pela interface devem ser verificadas sem alterar contas pessoais. Os testes de API já realizados não substituem essa lista.

Continuam pendentes a contabilização real de meditações, a análise mensal com IA e os restantes pontos em `PROJECT_STATUS.md`.

## Correção de hidratação e configuração TypeScript

Após a revisão, o utilizador identificou uma diferença entre `Thu` no HTML do servidor e o dia em português no navegador. O gráfico de sono usava o idioma predefinido do ambiente. Foi corrigido para usar explicitamente o idioma da AURA, formatando a data de calendário em UTC. As datas locais só são calculadas após montar o componente; servidor e primeira renderização do cliente partilham inicialmente o gráfico vazio, incluindo quando estão em fusos diferentes.

O `tsconfig.json` passou a usar `target: ES2020` e `moduleResolution: bundler`; `baseUrl` foi retirado, mantendo o alias relativo `@/*`. As opções obsoletas foram substituídas, sem adicionar uma opção para ocultar os avisos.

Verificação desta correção: sete testes de métricas aprovados (incluindo um novo caso que compara idiomas e fusos diferentes), TypeScript e lint sem erros, e resposta SSR de `/sleep` confirmada sem rótulos dependentes de idioma/data antes da montagem. A interação de hidratação no navegador continua a precisar de confirmação visual.
