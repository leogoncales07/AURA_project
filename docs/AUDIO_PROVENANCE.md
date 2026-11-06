# AURA — proveniência dos candidatos de áudio

Os três MP3 de origem não documentada foram retirados da web e do mobile. As seis cópias locais encontram-se em `tmp/aura-audio-quarantine/{frontend,mobile}`; essa pasta é ignorada pelo Git e não entra numa build. Os exercícios funcionam temporariamente sem som.

Hashes dos ficheiros colocados em quarentena:

| Nome | SHA-256 |
| --- | --- |
| `balance.mp3` | `4E75A22004904ED97CBC78922F4ACE2B145F660735EF3118E9FB8826DD0562F7` |
| `focus.mp3` | `A611F0424C0530981310DCFC5E6810732BFF221726B344206EE513DA8B06159E` |
| `sleep.mp3` | `8E3198B1A920860D519E244DF179DD024939D386E6942F0CF1C7BD1B6A2576E2` |

Foram criados candidatos procedurais originais através de `scripts/generate-audio-candidates.mjs`. O gerador não lê nem combina gravações, melodias, samples ou ficheiros de áudio de terceiros. Produz sinais matemáticos determinísticos e guarda um manifesto com parâmetros e SHA-256.

Os candidatos são loops WAV PCM mono de 30 segundos. A web e o mobile já repetem o áudio durante a duração escolhida pelo utilizador, pelo que um loop pequeno pode servir sessões de diferentes durações sem aumentar demasiado a aplicação.

## Gerar e validar

Na raiz do projeto:

```sh
node scripts/generate-audio-candidates.mjs
node scripts/validate-audio-candidates.mjs
```

Os ficheiros ficam em `tmp/aura-audio-candidates` e não substituem automaticamente os conteúdos atuais. Esta separação permite ouvi-los e rejeitá-los sem alterar a aplicação.

## Aprovação necessária

Antes da substituição:

1. ouvir os três ficheiros com auscultadores e com o altifalante do telemóvel;
2. confirmar que não há estalidos na repetição, frequências incómodas ou volume excessivo;
3. escolher aprovação, regeneração com outros parâmetros ou remoção de áudio;
4. depois de aprovados, copiar os WAV para web/mobile, atualizar as referências do código e atualizar `docs/content-rights.json` com os novos hashes e a prova de geração.

Até essa audição humana, o manifesto dos candidatos mantém o estado `candidate-not-approved` e o gate público continua corretamente bloqueado pela decisão de áudio, embora os ficheiros problemáticos já não sejam distribuídos.
