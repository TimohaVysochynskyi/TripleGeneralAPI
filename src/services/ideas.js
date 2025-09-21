import axios from 'axios';

import { TELEGRAM_TOKEN, TELEGRAM_CHAT_ID } from '../constants/index.js';

export async function sendIdeaToTelegram({ name, telegram, idea }) {
  const text = `Новая идея с сайта:\n\nИмя: ${name}\nTelegram: ${telegram}\nИдея: ${idea}`;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  return axios.post(url, {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'HTML',
  });
}
