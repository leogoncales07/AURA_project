# AURA — instalação local e publicação futura

## Estado atual

**Prioridade atual da PAP:** desenvolver e estabilizar as duas aplicações. A publicação está adiada até o professor disponibilizar domínio e licenças. Não é necessário criar contas de alojamento nesta fase. Ver `PROJECT_CONTEXT.md`.

A recuperação por e-mail foi confirmada pelo Leonardo: recebeu a mensagem e conseguiu alterar a palavra-passe. A migração e a importação com proprietário válido estão concluídas. Backend, renovação de sessão, exportação, isolamento RLS e eliminação de conta foram verificados no Supabase real com contas temporárias.

O domínio `aura.pt` **não está registado pelo utilizador** e ainda não há conta de alojamento. Não existem serviços públicos publicados nesta etapa. Os exemplos de produção usam URLs que terão de ser substituídos por endereços reais do alojamento.

Nesta preparação, Next.js e eslint-config-next foram atualizados para **15.5.28**. Foram corrigidas também dependências transitivas e a instalação do backend foi sincronizada com o lockfile. Resultado: auditorias `npm audit --omit=dev` de backend e frontend sem vulnerabilidades conhecidas reportadas, **33 testes aprovados**, nova validação no Supabase real aprovada e build standalone com ficheiros estáticos, áudio, páginas legais e CORS verificados.

## Testar neste computador, sem Docker

Usar Node.js 24 LTS ou uma versão compatível já instalada. Os comandos abaixo funcionam em PowerShell; se a política de scripts bloquear `npm`, usar `npm.cmd`.

Numa instalação nova, executar na raiz do projeto:

```sh
npm ci --prefix backend
npm ci --prefix frontend
```

Configurar `backend/.env` e `frontend/.env.local` com os exemplos respetivos. Estes ficheiros já estão configurados neste computador; não é necessário substituir as chaves existentes. A chave administrativa Supabase fica apenas em `backend/.env`.

Construir a web:

```sh
npm --prefix frontend run build
```

Iniciar os dois serviços:

```sh
node scripts/start-local.mjs
```

Em Windows também pode abrir `START_APP.bat`. O lançador usa o backend Node.js e a build web standalone; já não instala nem inicia o backend Python antigo. Serve a web em `http://localhost:3000` e a API em `http://localhost:8000`. `Ctrl+C` termina os dois serviços. As portas têm de estar livres.

O lançador limita o acesso a este computador. Para testar num telemóvel físico, é necessário um backend acessível pelo dispositivo e o URL correspondente em `mobile/.env`; `localhost` num telemóvel aponta para o próprio telemóvel.

### Testar no telemóvel com Expo Go

Manter o computador e o telemóvel na mesma rede Wi-Fi. Pode abrir `START_MOBILE.bat` ou executar:

```sh
node scripts/start-local.mjs --expo-go
```

Este modo inicia a API e a web acessíveis na rede local e o Metro direcionado explicitamente para **Expo Go**. Deteta a interface Wi-Fi e fornece os URLs do backend e da web ao bundle, evitando o IP antigo de `.env`. O QR code aparece no terminal. Se houver várias interfaces sem uma Wi-Fi identificável, indicar o endereço local com `--host=IP`.

Se já existir um Metro aberto, pode mantê-lo e iniciar apenas API/web em modo LAN com `node scripts/start-local.mjs --lan`. Ao alterar `mobile/.env`, recarregar o projeto no Expo Go; se continuar a usar os endereços antigos, reiniciar o Metro com `npm run start:go` em `mobile`.

Um bundle Android validado verifica a compilação JavaScript e dos assets. A reprodução em segundo plano, permissões e alterações de configuração nativa devem também ser testadas posteriormente numa build própria, respeitando as limitações do Expo Go. Esta etapa não exige publicação nas lojas.

Com os serviços a correr, pode verificar a instalação com `node scripts/check-local.mjs`.

## Contentores de teste

Foram preparados Dockerfiles separados para backend e web, usando Node 24, utilizador sem privilégios, instalação por lockfile e health checks. Os contextos Docker excluem `.env`, JSON legados, testes e `node_modules`. As chaves do backend entram apenas no ambiente de execução, nunca na imagem web ou em argumentos de build.

Se Docker estiver instalado:

```sh
docker compose -f compose.local.yaml up --build
```

Parar a instalação:

```sh
docker compose -f compose.local.yaml down
```

O Compose é **apenas local**: publica as portas em `127.0.0.1`, usa os URLs locais e reutiliza o projeto Supabase configurado em `backend/.env`. Não cria outra base de dados. As alterações feitas nesta instalação ficam nesse mesmo projeto Supabase.

Docker não está instalado no ambiente de validação, por isso as imagens não foram construídas aqui. A build standalone e os serviços Node são verificados diretamente. O ambiente de execução deverá conseguir aceder a Supabase e Gemini por HTTPS.

## Publicação futura — apenas quando for autorizada

Os Dockerfiles são portáveis para alojamentos com suporte a contentores. Em alternativa, um alojamento Node pode executar os comandos abaixo. A escolha e criação da conta ficam pendentes; não foram contratados planos, registados domínios ou aceites termos de serviço por automação.

Para preparar uma cópia de código para um repositório novo:

```sh
node scripts/prepare-release.mjs
```

O comando cria uma pasta em `tmp/aura-release`, com ficheiros selecionados de backend, web e mobile e um manifesto SHA-256. Exclui `.git`, `.env` reais, JSON legados, backups, módulos instalados e builds locais. Também verifica se alguma das chaves configuradas no backend apareceu por engano na cópia. Não enviar o repositório original com o seu histórico antes de rever os ficheiros legados já versionados. Usar um repositório **privado novo**, criado a partir desta cópia limpa, para o primeiro teste.

Uma opção para esse teste é [Render](https://render.com/docs/deploy-node-express-app), que suporta backend Express e [Next.js](https://render.com/docs/deploy-nextjs-app). A criação da conta e a ligação ao repositório exigem participação do utilizador. O plano [Free](https://render.com/docs/free) é adequado apenas à demonstração: tem limitações e não é recomendado pelo fornecedor para produção. Não foi escolhido nem ativado um plano nesta sessão.

### Backend

Diretório: `backend`. Instalar com `npm ci --omit=dev`, iniciar com `npm start` e usar `/health` para o health check. A porta deve ser fornecida pelo alojamento através de `PORT`.

Copiar os nomes de variáveis de `backend/.env.production.example` para o painel seguro do alojamento e preencher os valores reais. Nunca publicar esse ficheiro com chaves preenchidas. Definir `NODE_ENV=production`, o URL real de recuperação e a origem web exata em `CORS_ORIGINS`.

Se existir um reverse proxy do alojamento, configurar `TRUST_PROXY_HOPS` de acordo com a topologia do fornecedor; num único proxy de confiança, usar `1`. O valor predefinido é `0` para não confiar em cabeçalhos enviados diretamente por clientes. O shutdown trata `SIGTERM` e aguarda os pedidos em curso até 10 segundos.

Redis não é necessário para os fluxos migrados; só é ligado quando `REDIS_URL` está definido. Os endpoints antigos de avatar, 2FA, sessões e integrações continuam descritos em `docs/PROJECT_STATUS.md` como trabalho separado.

### Web

Diretório: `frontend`. Definir **antes da build** as três variáveis de `frontend/.env.production.example`, executar `npm ci` e `npm run build`, e iniciar com `npm start`.

A build já prepara `.next/standalone` com `public` e `.next/static`. `PORT` e `HOSTNAME=0.0.0.0` são definidos no ambiente de execução. `NEXT_PUBLIC_API_URL` é público e fica incorporado na build; ao alterar o URL da API, reconstruir a web. A identidade e o contacto das páginas legais também devem estar configurados durante a build.

### Supabase Auth e e-mails

Após conhecer o URL HTTPS da web, autorizar `<URL_WEB>/reset-password` em Authentication → URL Configuration no Supabase. Definir o Site URL e `PASSWORD_RESET_URL` para os endereços reais, e repetir o teste de recuperação nesse ambiente.

O teste de entrega ao e-mail pessoal passou. Isso não comprova entrega a todos os utilizadores: o SMTP predefinido do Supabase é destinado a testes e tem restrições de destinatários e de volume. Antes de abrir o cadastro ao público, configurar um fornecedor SMTP no Supabase e testar um destinatário externo. Usar o Gmail como contacto legal não configura um remetente SMTP.

### Mobile e domínio

Preencher `mobile/.env` com os dois URLs públicos HTTPS de `mobile/.env.production.example`. As variáveis públicas Expo não podem conter chaves administrativas. Só depois criar a build nativa e testar áudio, permissões, lembretes, recuperação de sessão e links legais num dispositivo físico.

Pode começar com o subdomínio HTTPS disponibilizado pelo alojamento, sem comprar um domínio. Quando existir um domínio registado e controlado pelo utilizador, ligar o DNS e atualizar web, backend, mobile e URLs do Supabase. Não usar `aura.pt` como destino real enquanto a sua propriedade não estiver confirmada.

Os textos legais continuam identificados como rascunho. A faturação e as condições do projeto Gemini ainda precisam de confirmação para disponibilizar a aplicação em Portugal/EEE. Consultar `docs/PROJECT_STATUS.md` para as pendências restantes.

## Referências

- [Atualização de segurança Next.js 15.5.28](https://nextjs.org/blog/nextjs-security-update-october-14-2026)
- [Build standalone Next.js](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/output)
- [Redirecionamentos Supabase Auth](https://supabase.com/docs/guides/auth/redirect-urls)
- [SMTP do Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
