import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { attachCustomer } from "./middleware/require-customer.js";
import { attachStaff } from "./middleware/require-staff.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { profilesRouter } from "./modules/profiles/routes.js";
import { catalogRouter } from "./modules/catalog/routes.js";
import { ordersRouter } from "./modules/orders/routes.js";
import { subscriptionsRouter } from "./modules/subscriptions/routes.js";
import { invoicesRouter } from "./modules/invoices/routes.js";
import { paymentsRouter } from "./modules/payments/routes.js";
import { stripeRouter, stripeWebhookRouter } from "./modules/stripe/routes.js";
import { ticketsRouter } from "./modules/tickets/routes.js";
import { staffAuthRouter } from "./modules/staffAuth/routes.js";
import { adminRouter } from "./modules/admin/routes.js";
import { contractsRouter } from "./modules/contracts/routes.js";
import { documensoWebhookRouter } from "./modules/webhooks/documenso-routes.js";
import { internalRouter } from "./modules/internal/routes.js";
import {
  isObjectStorageEnabled,
  storageObjectExists,
  streamStorageObjectToResponse,
} from "./services/storage-service.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use("/api/v1/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
app.use("/api/v1/webhooks/documenso", express.raw({ type: "*/*" }), documensoWebhookRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachCustomer);
app.use(attachStaff);

app.use("/files/uploads", express.static(env.uploadDir));
app.use("/files/invoices", express.static(env.invoiceDir));
app.get("/files/uploads/*", async (req, res, next) => {
  try {
    if (!isObjectStorageEnabled()) {
      next();
      return;
    }

    const relativePath = req.params[0];
    const key = `uploads/${relativePath}`;
    const exists = await storageObjectExists(key);
    if (!exists) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "private, max-age=0, no-store");
    await streamStorageObjectToResponse({
      key,
      res,
      fileName: relativePath.split("/").pop(),
      disposition: "inline",
    });
  } catch (error) {
    next(error);
  }
});
app.get("/files/invoices/*", async (req, res, next) => {
  try {
    if (!isObjectStorageEnabled()) {
      next();
      return;
    }

    const relativePath = req.params[0];
    const key = `invoices/${relativePath}`;
    const exists = await storageObjectExists(key);
    if (!exists) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "private, max-age=0, no-store");
    await streamStorageObjectToResponse({
      key,
      res,
      contentType: "application/pdf",
      fileName: relativePath.split("/").pop(),
      disposition: "inline",
    });
  } catch (error) {
    next(error);
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/profile", profilesRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/subscriptions", subscriptionsRouter);
app.use("/api/v1/invoices", invoicesRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/stripe", stripeRouter);
app.use("/api/v1/tickets", ticketsRouter);
app.use("/api/v1/contracts", contractsRouter);
app.use("/api/v1/staff/auth", staffAuthRouter);
app.use("/api/v1/internal", internalRouter);
app.use("/api/v1/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
