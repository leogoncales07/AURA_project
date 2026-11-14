# AURA — proveniência dos candidatos de áudio

Os três MP3 de origem não documentada foram retirados da web e do mobile. As seis cópias locais encontram-se em `tmp/aura-audio-quarantine/{frontend,mobile}`; essa pasta é ignorada pelo Git e não entra numa build. Em 14/11/2026, o responsável aprovou os três ambientes procedurais novos e autorizou a sua instalação na web e no mobile.

Hashes dos ficheiros colocados em quarentena:

| Nome | SHA-256 |
| --- | --- |
| `balance.mp3` | `4E75A22004904ED97CBC78922F4ACE2B145F660735EF3118E9FB8826DD0562F7` |
| `focus.mp3` | `A611F0424C0530981310DCFC5E6810732BFF221726B344206EE513DA8B06159E` |
| `sleep.mp3` | `8E3198B1A920860D519E244DF179DD024939D386E6942F0CF1C7BD1B6A2576E2` |

Foram criados candidatos procedurais originais através de `scripts/generate-audio-candidates.mjs`. O gerador não lê nem combina gravações, melodias, samples ou ficheiros de áudio de terceiros. Produz sinais matemáticos determinísticos de white, pink e brown noise, aplica filtros e crossfade de repetição e guarda um manifesto com parâmetros e SHA-256.

Os candidatos são loops WAV PCM mono de 30 segundos. A web e o mobile já repetem o áudio durante a duração escolhida pelo utilizador, pelo que um loop pequeno pode servir sessões de diferentes durações sem aumentar demasiado a aplicação.

Os primeiros candidatos tonais foram rejeitados pelo responsável por não soarem suficientemente naturais. Em 14/11/2026 foram substituídos por:

| Utilização proposta | Ambiente | Ficheiro | SHA-256 |
| --- | --- | --- | --- |
| Equilíbrio | chuva suave com white/pink noise e gotas procedurais discretas | `balance-gentle-rain-loop.wav` | `F02BFA11CD744D6E9AED63F79F36E6B6419A9FB0F2B2B8C1BA82191663CED824` |
| Foco | água/cachoeira distante com white, pink e brown noise em camadas | `focus-waterfall-loop.wav` | `3207C9D6F8CA764554242F6C8668C695A087C85CD39310051F4A386D97D9335A` |
| Sono | vento de floresta suave, conduzido por brown noise, com rajadas lentas | `sleep-brown-wind-loop.wav` | `735ECE55193CAB9271B673ECB2513B8D29662936F3C2D6D3CD83C70CC036EA92` |

`scripts/validate-audio-candidates.mjs` confirmou formato, duração, hashes, ausência de clipping, offset DC baixo e continuidade do loop. A validação técnica não substitui a audição humana.

## Gerar e validar

Na raiz do projeto:

```sh
node scripts/generate-audio-candidates.mjs
node scripts/validate-audio-candidates.mjs
```

Os ficheiros de trabalho ficam em `tmp/aura-audio-candidates`. Depois da aprovação, cópias com os hashes registados foram instaladas em `frontend/public/audio` e `mobile/assets/audio`.

No Windows, também é possível abrir `OUVIR_AUDIOS.bat` na raiz do projeto; o atalho abre diretamente a pasta dos candidatos.

## Processo de aprovação

Antes da substituição:

1. ouvir os três ficheiros com auscultadores e com o altifalante do telemóvel;
2. confirmar que não há estalidos na repetição, frequências incómodas ou volume excessivo;
3. escolher aprovação, regeneração com outros parâmetros ou remoção de áudio;
4. depois de aprovados, copiar os WAV para web/mobile, atualizar as referências do código e atualizar `docs/content-rights.json` com os novos hashes e a prova de geração.

O responsável rejeitou a primeira versão tonal, ouviu a versão ambiental e aprovou a instalação dos três ficheiros em 14/11/2026. `docs/content-rights.json` contém os hashes de cada cópia distribuída e o gate verifica-os. Se o gerador, os parâmetros ou qualquer WAV forem alterados, os novos hashes exigem nova audição e aprovação antes de substituir estes ficheiros.
