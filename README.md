# AURA

Aplicação de bem-estar desenvolvida como Prova de Aptidão Profissional (PAP) por **Leonardo Pierre Gonçales e Matheus Esaka Silva**. Inclui registos de humor e sono, avaliações, meditações, relatórios e um companion com IA.

A prioridade é completar e testar o projeto. A publicação fica para uma fase posterior, quando o professor disponibilizar o domínio e as licenças.

## Organização

| Pasta | Conteúdo |
| --- | --- |
| `backend/` | API Node.js/Express, serviços Supabase/Gemini, SQL, testes e ferramentas de dados |
| `frontend/` | Aplicação web Next.js |
| `mobile/` | Aplicação React Native/Expo, testada num telemóvel com Expo Go |
| `scripts/` | Arranque local, verificação e preparação de uma cópia de código |
| `docs/` | Instalação, contexto da PAP, estado do projeto e registo da limpeza |
| `tmp/` | Cópias de segurança e ficheiros locais, excluídos do Git |

Pode abrir `AURA.code-workspace` no VS Code para trabalhar nas três partes em conjunto.

## Testar localmente

Neste computador, as dependências e os ficheiros de ambiente já estão configurados. Para uma instalação nova, seguir [docs/SETUP.md](docs/SETUP.md).

- **Web e API:** abrir `START_APP.bat`.
- **Expo Go, API e web na rede local:** abrir `START_MOBILE.bat`, manter computador/telemóvel na mesma rede Wi-Fi e ler o QR code.
- Parar um arranque anterior com `Ctrl+C` antes de iniciar outro, para libertar as portas.

Os lançadores usam a build web existente. Depois de alterar o código web, executar `npm.cmd --prefix frontend run build`; para desenvolvimento com atualização automática, consultar o [README da web](frontend/README.md).

As chaves ficam nos `.env` locais. Não é necessário substituir as configurações atuais nem publicar a aplicação para continuar os testes. Os JSON de `backend/data/` são originais legados preservados; os fluxos atuais guardam os dados no Supabase.

## Documentação

- [Instalação e testes locais; publicação futura](docs/SETUP.md)
- [Estado, validações e pendências](docs/PROJECT_STATUS.md)
- [Contexto e prioridades da PAP](docs/PROJECT_CONTEXT.md)
- [Limpeza e organização efetuadas](docs/CLEANUP.md)
- [Backend](backend/README.md), [web](frontend/README.md) e [mobile](mobile/README.md)
