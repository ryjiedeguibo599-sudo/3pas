const axios = require('axios');
const db = require('../config/db');

async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    return;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    badge: 1,
    title: title,
    body: body,
    data: data,
  };

  try {
    await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

async function notifyUser(userId, title, body, data = {}) {
  try {
    const result = await db.query('SELECT expo_push_token FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0 && result.rows[0].expo_push_token) {
      await sendPushNotification(result.rows[0].expo_push_token, title, body, data);
    }
  } catch (err) {
    console.error('notifyUser DB error:', err);
  }
}

async function notifyProviders(title, body, data = {}) {
  try {
    const result = await db.query("SELECT expo_push_token FROM users WHERE role = 'provider' AND expo_push_token IS NOT NULL");
    for (const row of result.rows) {
      if (row.expo_push_token) {
        await sendPushNotification(row.expo_push_token, title, body, data);
      }
    }
  } catch (err) {
    console.error('notifyProviders DB error:', err);
  }
}

module.exports = { sendPushNotification, notifyUser, notifyProviders };
