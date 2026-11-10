import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_ID = 'aura-daily-mood';
const REMINDER_CHANNEL_ID = 'aura-reminders';
const REMINDER_COPY = {
  pt: 'Como se sente hoje? Reserve um minuto para registar o seu bem-estar.',
  en: 'How are you feeling today? Take a minute to record your wellbeing.',
  es: '¿Cómo se siente hoy? Dedique un minuto a registrar su bienestar.',
  fr: 'Comment vous sentez-vous aujourd’hui ? Prenez une minute pour noter votre bien-être.',
  de: 'Wie fühlen Sie sich heute? Nehmen Sie sich eine Minute, um Ihr Wohlbefinden festzuhalten.',
};
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function ensureReminderChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Lembretes AURA',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

function permissionAllowsNotifications(permission) {
  return permission.granted
    || (Platform.OS === 'ios' && permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
}

export async function cancelDailyMoodReminder() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return false;
  await ensureReminderChannel();
  let permission = await Notifications.getPermissionsAsync();
  if (!permissionAllowsNotifications(permission)) permission = await Notifications.requestPermissionsAsync();
  return permissionAllowsNotifications(permission);
}
export async function scheduleDailyMoodReminder(time = '21:00', locale = 'pt') {
  if (Platform.OS === 'web') return;
  const [hour, minute] = time.split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Invalid reminder time');
  }
  await ensureReminderChannel();
  await cancelDailyMoodReminder();
  return Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: 'AURA', body: REMINDER_COPY[locale] || REMINDER_COPY.pt, sound: 'default', data: { destination: 'dashboard' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: REMINDER_CHANNEL_ID },
  });
}
export async function configureDailyReminder(time, locale = 'pt') {
  if (!await registerForPushNotificationsAsync()) return false;
  await scheduleDailyMoodReminder(time, locale);
  return true;
}

export async function restoreDailyReminder(time, locale = 'pt') {
  if (Platform.OS === 'web') return false;
  await ensureReminderChannel();
  const permission = await Notifications.getPermissionsAsync();
  if (!permissionAllowsNotifications(permission)) {
    await cancelDailyMoodReminder();
    return false;
  }
  await scheduleDailyMoodReminder(time, locale);
  return true;
}

export async function sendTestReminder(locale = 'pt') {
  if (!await registerForPushNotificationsAsync()) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'AURA', body: REMINDER_COPY[locale] || REMINDER_COPY.pt, sound: 'default', data: { test: true } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: REMINDER_CHANNEL_ID },
  });
  return true;
}
