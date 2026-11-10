# AURA — plano de demonstração e publicação

Este documento separa o que é necessário para apresentar a PAP do que só é necessário para abrir a aplicação ao público. Nenhuma compra deve ser feita antes de o professor confirmar o âmbito, o titular das contas e o orçamento.

## Fase 1 — demonstração escolar

- [x] Manter o Supabase atual; o plano gratuito é suficiente para desenvolvimento e demonstrações pequenas.
- [x] Manter web, API e mobile separados, reutilizando a mesma API.
- [x] Preparar links opcionais para Google Play e App Store; sem URL oficial, a web mostra apenas «disponível brevemente».
- [x] Retirar da página inicial afirmações de acompanhamento médico, terapeuta, precisão clínica e efeito instantâneo.
- [x] Identificar o chat como IA automática, em todos os idiomas, antes da primeira mensagem e indicar que não é um profissional de saúde nem um serviço de emergência.
- [ ] Aprovar e instalar os candidatos originais de `tmp/aura-audio-candidates`, ou manter os exercícios sem som; os MP3 de origem desconhecida já foram colocados em quarentena. Ver `docs/AUDIO_PROVENANCE.md`.
- [x] Rever os exercícios e guardar as referências consultadas sem sugerir parceria com as instituições citadas; ver `docs/CONTENT_REFERENCES.md`.
- [ ] Usar apenas contas fictícias e evitar dados reais de colegas durante a apresentação.
- [x] Preparar `START_SCHOOL_DEMO.bat` e a verificação `check-local --school-demo`; este modo bloqueia o Gemini sem alterar o `.env` e exclui os áudios em quarentena.
- [ ] No dia da apresentação, iniciar com o lançador escolar e executar a verificação descrita em `docs/SCHOOL_DEMO_RUNBOOK.md`.
- [ ] Confirmar visualmente web e mobile num dispositivo físico.

## Decisões necessárias antes da publicação pública

- [ ] Responsável pelo serviço: escola, autores ou outra entidade.
- [ ] Público: exclusivamente maiores de 18 anos ou serviço sem o Gemini atual para menores.
- [ ] Titular do domínio, faturação e contas das lojas.
- [ ] Nome final após pesquisa de domínio e de marcas.
- [ ] Endereço de contacto público e política de conservação dos dados.

## Fase 2 — teste público controlado

- [x] Criar e verificar uma cópia limpa com `node scripts/prepare-release.mjs`.
- [ ] Criar um repositório privado novo e enviar apenas a cópia limpa aprovada.
- [ ] Publicar web e API num alojamento HTTPS de teste; Render é uma opção, não uma obrigação.
- [ ] Configurar URLs de produção, CORS, recuperação de palavra-passe e redirecionamentos Supabase.
- [ ] Configurar SMTP próprio para mensagens de autenticação.
- [ ] Finalizar política de privacidade e termos, incluindo Supabase e Gemini.
- [ ] Testar cadastro, confirmação, recuperação, exportação e eliminação com contas temporárias.
- [ ] Criar um procedimento curto de incidentes e de rotação de chaves.

## Fase 3 — lojas e lançamento

- [ ] Confirmar que os identificadores `com.aura.mentalhealth` podem ser usados ou escolher identificadores definitivos antes da primeira publicação.
- [ ] Criar a conta Google Play e, se necessário, Apple Developer.
- [ ] Criar builds nativas, testar áudio em segundo plano, notificações, permissões e links legais.
- [ ] Preencher as declarações de privacidade, segurança de dados e funcionalidades de saúde das lojas.
- [ ] Publicar primeiro numa faixa de teste fechada.
- [ ] Depois de cada listagem existir, definir na build web:
  - `NEXT_PUBLIC_GOOGLE_PLAY_URL`
  - `NEXT_PUBLIC_APP_STORE_URL`
- [ ] Substituir os links textuais por badges oficiais das lojas, se forem usados como material promocional.

## Registo inicial de conteúdos

| Conteúdo | Estado atual | Ação antes de distribuir |
| --- | --- | --- |
| `balance.mp3` | retirado da app e colocado em quarentena local | ouvir/aprovar o candidato WAV ou manter sem som |
| `focus.mp3` | retirado da app e colocado em quarentena local | ouvir/aprovar o candidato WAV ou manter sem som |
| `sleep.mp3` | retirado da app e colocado em quarentena local | ouvir/aprovar o candidato WAV ou manter sem som |
| logótipos e ícones AURA | autoria a confirmar | registar quem criou e guardar os originais |
| exercícios de respiração/atenção | revistos como adaptações educativas | manter o registo em `docs/CONTENT_REFERENCES.md` atualizado |
| dependências de código | inventário automático em `docs/DEPENDENCY_LICENSES.md` | rever itens sinalizados e incluir os textos/avisos completos na distribuição final |

## Configuração dos links das lojas

Os links só são apresentados quando são HTTPS e pertencem a `play.google.com` ou `apps.apple.com`. As variáveis são incorporadas durante a build do Next.js; depois de as alterar, é necessário reconstruir a web.

## Gate de publicação pública

O comando seguinte é deliberadamente mais exigente do que a verificação escolar:

```sh
cd backend
npm run check:release
```

Ele lê a configuração ativa sem mostrar segredos e só devolve `ready: true` quando ambientes HTTPS, domínio, pelo menos uma loja escolhida, responsável, idade, conservação, fornecedores, Gemini, textos legais, identificadores e direitos dos conteúdos estiverem resolvidos. Em `targetStores`, usar `googlePlay`, `appStore` ou ambos; apenas as lojas selecionadas exigem conta e URL. As decisões humanas ficam em `docs/release-decisions.json`; os direitos e respetivas provas ficam em `docs/content-rights.json`.

O estado atual deve ser `ready: false`: isso é uma proteção, não uma falha do desenvolvimento. Não alterar um valor apenas para tornar o teste verde; preencher cada decisão com prova e atualizar o conteúdo correspondente. O procedimento operacional inicial de incidentes está em `docs/INCIDENT_RESPONSE.md`.

## Conta e modo de demonstração escolar

Os antigos atalhos de demonstração foram removidos: a web criava um token falso e o mobile continha credenciais fixas. Para apresentar, criar no Supabase uma conta dedicada com nome, e-mail e registos inteiramente fictícios. A palavra-passe não deve ser colocada no código, nos ficheiros `.env` públicos ou nos diapositivos.

No computador da apresentação, copiar apenas os valores relevantes de `backend/.env.school.example` para `backend/.env`, preservando as chaves Supabase privadas já configuradas. Em seguida, a partir de `backend/`:

```sh
npm run check:school-demo
```

Também é possível validar o modelo sem alterar a configuração ativa:

```sh
npm run check:school-demo -- --env .env.school.example
```

O resultado deve mostrar `ready: true`. O endpoint `/health` indica `schoolDemo: true` quando o servidor arrancou efetivamente nesse modo. Antes de uma publicação pública, voltar a configurar explicitamente `AURA_SCHOOL_DEMO=false` e decidir, de acordo com a idade do público e os termos aplicáveis, se o Gemini pode ser ativado.
