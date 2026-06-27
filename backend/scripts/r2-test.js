import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import {
  deleteContractObjectForTests,
  getContractR2Client,
  uploadContractObject,
} from "../services/contract-storage-service.js";

async function bodyToString(body) {
  if (typeof body?.transformToString === "function") {
    return body.transformToString();
  }
  if (typeof body?.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray()).toString("utf8");
  }
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  if (env.nodeEnv === "production") {
    throw new Error("Refusing to run r2:test with NODE_ENV=production.");
  }

  const key = `development-tests/r2-test-${Date.now()}.txt`;
  const body = `ElevenOrbits R2 test ${new Date().toISOString()}`;

  await uploadContractObject({
    key,
    body: Buffer.from(body),
    contentType: "text/plain",
    metadata: {
      purpose: "development-r2-test",
    },
  });

  const result = await getContractR2Client().send(
    new GetObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
    }),
  );
  const downloaded = await bodyToString(result.Body);

  if (downloaded !== body) {
    throw new Error("R2 readback did not match uploaded content.");
  }

  await deleteContractObjectForTests(key);
  console.log(`R2 test passed for ${key}`);
}

main().catch((error) => {
  console.error(error.message || "R2 test failed.");
  process.exit(1);
});
