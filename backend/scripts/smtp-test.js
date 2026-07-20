import { sendEmailTestNotification, verifyEmailTransport } from "../services/email-service.js";

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : "";
}

const transport = await verifyEmailTransport();
if (!transport.ok) {
  console.error(`SMTP verification failed: ${transport.code}`);
  process.exitCode = 1;
} else {
  console.log("SMTP connection, TLS verification, and authentication succeeded.");

  const recipient = readArgument("--send-to");
  if (recipient) {
    const delivery = await sendEmailTestNotification({ to: recipient });
    if (!delivery.delivered) {
      console.error(`SMTP test email failed: ${delivery.code}`);
      process.exitCode = 1;
    } else {
      console.log(`SMTP test email was accepted for delivery to ${recipient}.`);
    }
  } else {
    console.log("No message sent. Pass --send-to user@example.com to test delivery.");
  }
}
