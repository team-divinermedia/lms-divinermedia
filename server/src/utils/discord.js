export const sendDiscordNotification = async (title, message, color = 0x5865F2) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title,
          description: message,
          color,
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (error) {
    console.error('Discord webhook error:', error);
  }
};
