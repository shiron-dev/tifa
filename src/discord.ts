import fetch from "node-fetch";

export async function sendDiscordWebhook(message: string, webhookUrl: string): Promise<void> {
  if (!message || !webhookUrl) {
    console.error("Error: message or webhookUrl is empty.");
    return;
  }

  const payload = {
    content: message,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`Discord Webhook failed (status code: ${response.status}): ${responseText}`);
    }
  }
  catch (error: any) {
    console.error("Discord Webhook Error:", error.message);
  }
}
