# AURA — guião da demonstração escolar

Este modo destina-se à apresentação local da PAP. Não publica a aplicação, não cria serviços externos e não substitui as verificações necessárias para um lançamento público.

## Antes do dia

1. Criar uma conta Supabase dedicada à demonstração, com nome, e-mail e registos inteiramente fictícios. Guardar a palavra-passe fora do Git e dos diapositivos.
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
