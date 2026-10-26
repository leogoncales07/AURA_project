const app = require('./app.json');
module.exports = () => {
  if (process.env.EAS_BUILD_PROFILE === 'production') {
    for (const key of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_WEB_URL']) {
      if (!process.env[key]?.startsWith('https://')) throw new Error(`${key} must contain the public HTTPS URL before a production build.`);
    }
  }
  return app.expo;
};
