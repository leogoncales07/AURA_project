import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_ID = 'aura-daily-mood';
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function cancelDailyMoodReminder() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('aura-reminders', {
    name: 'Lembretes AURA', importance: Notifications.AndroidImportance.DEFAULT,
  });
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  return status === 'granted';
}
export async function scheduleDailyMoodReminder(time = '21:00') {
  if (Platform.OS === 'web') return;
  const [hour, minute] = time.split(':').map(Number);
  await cancelDailyMoodReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: 'AURA', body: 'Como se sente hoje? Reserve um minuto para registar o seu bem-estar.', sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'aura-reminders' },
  });
}
export async function configureDailyReminder(time) {
  if (!await registerForPushNotificationsAsync()) return false;
  await scheduleDailyMoodReminder(time);
  return true;
}
