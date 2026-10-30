import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import { serviceUrl } from '../lib/dev-server.mjs';
export default function LegalNotice({ color = '#94a3b8' }) {
  const open = async path => {
    const metroUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoGo?.debuggerHost || Constants?.manifest?.debuggerHost || '';
    const url = serviceUrl(process.env.EXPO_PUBLIC_WEB_URL, metroUri, 3000, __DEV__);
    if (!url) { Alert.alert('AURA', 'As páginas legais ainda não foram configuradas nesta versão. / Legal pages are not configured in this build.'); return; }
    try { await Linking.openURL(url.replace(/\/$/, '') + path); }
    catch { Alert.alert('AURA', 'Não foi possível abrir a página. / Unable to open page.'); }
  };
  return <View style={{ padding: 16, alignItems: 'center', gap: 10 }}>
    <Text style={{ color, fontSize: 12, textAlign: 'center' }}>A AURA apoia o bem-estar. Não substitui cuidados de saúde nem serviços de emergência. / AURA supports wellbeing. It does not replace healthcare or emergency services.</Text>
    <View style={{ flexDirection: 'row', gap: 20 }}>
      <TouchableOpacity onPress={() => open('/privacy')}><Text style={{ color, fontSize: 12 }}>Privacidade / Privacy</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => open('/terms')}><Text style={{ color, fontSize: 12 }}>Termos / Terms</Text></TouchableOpacity>
    </View>
  </View>;
}
