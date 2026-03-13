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
import { ticketsRouter } from "./modules/tickets/routes.js";
import { staffAuthRouter } from "./modules/staffAuth/routes.js";
import { adminRouter } from "./modules/admin/routes.js";

const app = express();

app.use(
  cors({
    origin: [env.appUrl],
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachCustomer);
app.use(attachStaff);

app.use("/files/uploads", express.static(env.uploadDir));
app.use("/files/invoices", express.static(env.invoiceDir));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/profile", profilesRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/subscriptions", subscriptionsRouter);
app.use("/api/v1/invoices", invoicesRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/tickets", ticketsRouter);
app.use("/api/v1/staff/auth", staffAuthRouter);
app.use("/api/v1/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
