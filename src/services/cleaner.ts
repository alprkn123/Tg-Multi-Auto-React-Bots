export function scheduleDelete(
  botToken: string,
  chatId: number | string,
  messageIds: number[],
  delaySeconds: number
) {
  setTimeout(async () => {
    try {
      for (const msgId of messageIds) {
        await deleteMessage(botToken, chatId, msgId);
      }
      await sendMessage(botToken, chatId, '🧹 Video and transcript have been deleted.');
    } catch (error) {
      console.error('Auto-delete error:', error);
    }
  }, delaySeconds * 1000);
}

async function deleteMessage(botToken: string, chatId: number | string, messageId: number) {
  const url = `https://api.telegram.org/bot${botToken}/deleteMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId })
  });
}

async function sendMessage(botToken: string, chatId: number | string, text: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
