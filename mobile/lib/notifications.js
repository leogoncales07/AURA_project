import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up the global handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }
  
  return true;
}

export async function scheduleDailyMoodReminder() {
    // Avoid double scheduling by clearing existing ones
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Schedule new 8:00 PM local notification
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Como você está se sentindo? 🌙",
            body: "Não quebre sua sequência. Tire um minuto para registrar seu humor de hoje.",
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 20, // 8:00 PM
            minute: 0,
        },
    });
}
