# AURA — guião da demonstração escolar

Este modo destina-se à apresentação local da PAP. Não publica a aplicação, não cria serviços externos e não substitui as verificações necessárias para um lançamento público.

## Antes do dia

1. Criar uma conta Supabase dedicada à demonstração. Usar um endereço de e-mail real que o responsável controle para receber a confirmação, mas que não revele o e-mail pessoal durante a apresentação; o nome visível e todos os registos de bem-estar devem ser fictícios. Guardar a palavra-passe fora do Git e dos diapositivos.
2. Não usar contas nem respostas reais de colegas. Não pedir à audiência para introduzir dados pessoais.
3. Construir a web atual:

   ```sh
   npm --prefix frontend run build
   ```

4. Confirmar o modelo de segurança:

   ```sh
   cd backend
   npm run check:school-demo -- --env .env.school.example
   cd ..
   ```

5. Abrir previamente web e mobile, iniciar sessão com a conta fictícia e confirmar os ecrãs que serão apresentados.
6. No mobile, abrir Definições, ativar o lembrete diário e usar «Testar notificação». Confirmar que a permissão do sistema foi concedida e que o aviso aparece em poucos segundos.
7. Confirmar no telemóvel a reprodução, repetição e volume dos três ambientes já aprovados: chuva, cachoeira e vento/brown noise.

## Ordem recomendada para começar

1. Criar/controlar o e-mail dedicado e registar a conta de demonstração.
2. Executar `START_SCHOOL_DEMO.bat` com computador e telemóvel na mesma rede Wi-Fi.
3. Executar `node scripts/check-local.mjs --school-demo` noutro terminal.
4. Percorrer login, humor, sono, avaliação, exercícios, relatórios, exportação e lembrete local.
5. Anotar qualquer problema visual ou funcional antes de preparar os dados fictícios definitivos.

## Arranque recomendado

No Windows, abrir `START_SCHOOL_DEMO.bat`. Em alternativa:

```sh
node scripts/start-local.mjs --school-demo --expo-go
```

O comando:

- inicia web e API localmente;
- expõe apenas essas portas à rede local necessária ao Expo Go;
- força `AURA_SCHOOL_DEMO=true` e `GEMINI_ENABLED=false` no processo da API, sem alterar `backend/.env`;
- fornece ao Expo Go os URLs LAN atuais;
- mantém os exercícios funcionais sem distribuir os MP3 colocados em quarentena.

Se existirem várias interfaces de rede, indicar o IP Wi-Fi mostrado por `ipconfig`:

```sh
node scripts/start-local.mjs --school-demo --expo-go --host=192.168.x.x
```

Não encaminhar portas no router, não partilhar o QR code fora da sala e não usar este modo como alojamento público.

## Como o júri pode aceder

Existem duas modalidades diferentes:

### Demonstração presencial sem publicação

- O apresentador usa o computador e o telemóvel já preparados.
- Se o júri estiver na mesma rede Wi-Fi, pode abrir no navegador o URL `http://<IP-Wi-Fi-do-computador>:3000` mostrado pelo lançador.
- Para experimentar o mobile, cada dispositivo precisa do Expo Go e deve ler o QR code do Metro. Este acesso depende do computador continuar ligado e dos dispositivos conseguirem comunicar na mesma rede.
- Não é necessário domínio, alojamento público ou publicação nas lojas.

### Acesso independente por link ou aplicação instalada

- Para o júri abrir a web fora da rede da apresentação, web e API precisam de alojamento HTTPS público. Um endereço temporário do fornecedor pode ser usado antes de comprar domínio.
- Para Android, pode ser criada uma build APK de teste interno sem publicar na Google Play; ela deve apontar para uma API acessível pelo dispositivo.
- A distribuição de teste em iPhone exige uma build e o fluxo de dispositivos/testadores da Apple. O Expo Go continua a ser a opção mais simples para a apresentação presencial.
- A publicação nas lojas só é necessária quando se pretende uma listagem pública ou distribuição normal ao público; não é obrigatória para uma avaliação fechada.

## Verificação com os serviços abertos

Noutro terminal:

```sh
node scripts/check-local.mjs --school-demo
```

O resultado deve indicar:

- `schoolDemo: true`;
- web standalone e ficheiros estáticos acessíveis;
- áudio em quarentena não distribuído;
- páginas legais acessíveis;
- CORS local permitido e origem externa recusada.

Também é possível abrir `http://localhost:8000/health` e confirmar `"schoolDemo": true`.

## Durante a apresentação

- Explicar que o chat é um sistema automático e que o Gemini está desligado neste modo.
- Usar apenas cenários e dados fictícios preparados.
- Não projetar o painel Supabase, ficheiros `.env`, tokens, chaves ou palavras-passe.
- Se alguém introduzir informação real, parar a partilha do ecrã e não continuar a explorar esse registo.
- Ter capturas de ecrã ou vídeo local como alternativa a uma falha de Wi-Fi.

## Depois

1. Usar `Ctrl+C` no terminal do lançador. Se o terminal Windows tiver sido fechado ou os serviços continuarem ativos, executar `STOP_AURA.bat`; ele usa apenas os PIDs registados pelo lançador atual.
2. Confirmar que as portas 3000 e 8000 deixaram de responder.
3. Terminar sessão no telemóvel se este for partilhado.
4. Manter ou eliminar a conta fictícia conforme a próxima demonstração; nunca a converter numa conta real.

Para esta apresentação fechada, com dados fictícios e sem IA externa, não é necessário concluir previamente domínio, lojas, alojamento público ou textos jurídicos finais. Esses itens continuam obrigatórios apenas no gate de publicação descrito em `docs/RELEASE_PLAN.md`.
