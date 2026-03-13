import { connectToDatabase } from "./db/connection.js";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { ensureBootstrapData } from "./services/bootstrap-service.js";
import { startBillingCycleScheduler } from "./services/billing-cycle-service.js";

async function startServer() {
  await connectToDatabase();
  await ensureBootstrapData();
  startBillingCycleScheduler();

  app.listen(env.port, () => {
    console.log(`ElevenOrbits API running on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
