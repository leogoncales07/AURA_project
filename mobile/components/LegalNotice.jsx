import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
export default function LegalNotice({ color = '#94a3b8' }) {
  const open = async path => {
    const url = process.env.EXPO_PUBLIC_WEB_URL;
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
