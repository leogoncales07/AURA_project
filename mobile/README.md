# AURA — mobile

Aplicação React Native/Expo. As telas e a navegação ficam em `app/`, os componentes em `components/`, o tema em `constants/Theme.js`, o cliente da API e os lembretes em `lib/`, as traduções em `i18n/` e os áudios/imagens em `assets/`.

## Testar no Expo Go

O fluxo atual usa um telemóvel físico na mesma rede Wi-Fi do computador. Na raiz do projeto, abrir `START_MOBILE.bat`: inicia a API, a build web local e o Metro explicitamente em modo Expo Go, com os endereços da rede local.

Se a API já estiver acessível na rede e quiser iniciar apenas o Metro, executar nesta pasta:

```sh
npm ci
npm run start:go
```

Nesse caso, confirmar os endereços em `.env`. No telemóvel, `localhost` refere-se ao próprio dispositivo. Recarregar o bundle após alterar a configuração; reiniciar o Metro se necessário.

`app.json` e `app.config.js` contêm a configuração Expo. A pasta Android local foi preservada. As alterações de configuração nativa e funcionalidades como áudio em segundo plano precisam de validação posterior numa build própria. Não é necessário publicar nas lojas para realizar esse teste.

Consultar [instalação local](../docs/SETUP.md) e [pendências](../docs/PROJECT_STATUS.md).
