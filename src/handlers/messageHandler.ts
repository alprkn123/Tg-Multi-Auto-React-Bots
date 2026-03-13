import { extractUrl, detectPlatform } from '../utils/urlParser';
import { downloadVideo } from '../services/downloader';
import { transcribeAudio } from '../services/transcriber';
import { scheduleDelete } from '../services/cleaner';

export async function handleUpdate(botToken: string, update: any, env: any) {
  try {
    if (!update?.message) return;

    const chatId = update.message.chat.id;
    const userId = update.message.from.id;
    const username = update.message.from.username || update.message.from.first_name;
    const text = update.message.text || '';

    if (text === '/start') {
      await sendMessage(botToken, chatId, 
        '🎬 *Bot Downloader*\n\n' +
        'Kirim link dari:\n' +
        '• YouTube\n' +
        '• TikTok\n' +
        '• Instagram\n\n' +
        'Bot akan download video + transkrip audio.\n' +
        'File akan auto-hapus setelah 5 menit!',
        'Markdown'
      );
      return;
    }

    const url = extractUrl(text);
    if (!url) {
      await sendMessage(botToken, chatId, '❌ Kirim link YouTube/TikTok/Instagram yang valid!');
      return;
    }

    await sendChatAction(botToken, chatId, 'typing');
    const statusMsg = await sendMessage(botToken, chatId, '⏳ Processing...');

    try {
      const platform = detectPlatform(url);
      await editMessage(botToken, chatId, statusMsg.message_id, `⏳ Downloading from ${platform}...`);

      const videoBuffer = await downloadVideo(url, platform);
      const videoId = Date.now().toString();

      await editMessage(botToken, chatId, statusMsg.message_id, '⏳ Transcribing audio...');
      const transcript = await transcribeAudio(videoBuffer, env);

      await deleteMessage(botToken, chatId, statusMsg.message_id);

      const videoMsg = await sendVideo(botToken, chatId, videoBuffer, `🎬 Downloaded from ${platform}`);
      const textMsg = await sendMessage(botToken, chatId, `📝 *Transcript:*\n\n${transcript}`, 'Markdown');

      scheduleDelete(botToken, chatId, [videoMsg.message_id, textMsg.message_id], 300);
    } catch (error) {
      await editMessage(botToken, chatId, statusMsg.message_id, `❌ Error: ${error.message}`);
    }
  } catch (e) {
    console.error('Error in handleUpdate:', e);
  }
}

async function sendMessage(botToken: string, chatId: number | string, text: string, parseMode?: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload: any = { chat_id: chatId, text };
  if (parseMode) payload.parse_mode = parseMode;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return await res.json();
}

async function editMessage(botToken: string, chatId: number | string, messageId: number, text: string) {
  const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
  await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }) });
}

async function deleteMessage(botToken: string, chatId: number | string, messageId: number) {
  const url = `https://api.telegram.org/bot${botToken}/deleteMessage`;
  await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, message_id: messageId }) });
}

async function sendChatAction(botToken: string, chatId: number | string, action: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;
  await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, action }) });
}

async function sendVideo(botToken: string, chatId: number | string, buffer: ArrayBuffer, caption: string) {
  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('video', new Blob([buffer]), 'video.mp4');
  formData.append('caption', caption);
  const url = `https://api.telegram.org/bot${botToken}/sendVideo`;
  const res = await fetch(url, { method: 'POST', body: formData });
  return await res.json();
}
