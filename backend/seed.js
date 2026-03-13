import { connectToDatabase } from "./db/connection.js";
import { ensureBootstrapData } from "./services/bootstrap-service.js";

async function main() {
  await connectToDatabase();
  await ensureBootstrapData();
  console.log("Seed complete");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
