export async function sendMockEmail(to: string, subject: string, body: string) {
  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}\n${body}`);
  if (process.env.SIMULATE_EMAIL_FAILURE === "true") {
    throw new Error("Simulated email provider failure");
  }
  return { messageId: `mock-${Date.now()}` };
}
