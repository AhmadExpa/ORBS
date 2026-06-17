import { query } from "./postgres-client.js";

const documentIndexes = [
  ["eo_documents_collection_created_idx", "collection, created_at DESC"],
  ["eo_documents_collection_updated_idx", "collection, updated_at DESC"],
  ["eo_documents_collection_slug_idx", "collection, (data->>'slug')"],
  ["eo_documents_collection_email_idx", "collection, lower(data->>'email')"],
  ["eo_documents_collection_clerk_idx", "collection, (data->>'clerkId')"],
  ["eo_documents_collection_status_idx", "collection, (data->>'status')"],
  ["eo_documents_collection_user_idx", "collection, (data->>'userId')"],
  ["eo_documents_collection_order_idx", "collection, (data->>'orderId')"],
  ["eo_documents_collection_subscription_idx", "collection, (data->>'subscriptionId')"],
  ["eo_documents_collection_plan_idx", "collection, (data->>'productPlanId')"],
  ["eo_documents_collection_category_idx", "collection, (data->>'categoryId')"],
  ["eo_documents_collection_invoice_number_idx", "collection, (data->>'invoiceNumber')"],
  ["eo_documents_collection_gateway_payment_idx", "collection, (data->>'gatewayPaymentId')"],
  ["eo_documents_collection_gateway_checkout_idx", "collection, (data->>'gatewayCheckoutSessionId')"],
  ["eo_documents_collection_renewal_date_idx", "collection, (data->>'renewalDate')"],
  ["eo_documents_collection_submitted_at_idx", "collection, (data->>'submittedAt') DESC"],
  ["eo_documents_collection_issued_at_idx", "collection, (data->>'issuedAt') DESC"],
];

const uniqueDocumentIndexes = [
  [
    "eo_documents_users_clerk_unique_idx",
    "(data->>'clerkId')",
    "collection = 'users' AND COALESCE(data->>'clerkId', '') <> ''",
  ],
  [
    "eo_documents_users_email_unique_idx",
    "lower(data->>'email')",
    "collection = 'users' AND COALESCE(data->>'email', '') <> ''",
  ],
  [
    "eo_documents_staff_email_unique_idx",
    "lower(data->>'email')",
    "collection = 'staff_users' AND COALESCE(data->>'email', '') <> ''",
  ],
  [
    "eo_documents_categories_slug_unique_idx",
    "(data->>'slug')",
    "collection = 'service_categories' AND COALESCE(data->>'slug', '') <> ''",
  ],
  [
    "eo_documents_plans_slug_unique_idx",
    "(data->>'slug')",
    "collection = 'product_plans' AND COALESCE(data->>'slug', '') <> ''",
  ],
  [
    "eo_documents_invoices_number_unique_idx",
    "(data->>'invoiceNumber')",
    "collection = 'invoices' AND COALESCE(data->>'invoiceNumber', '') <> ''",
  ],
  [
    "eo_documents_admin_key_unique_idx",
    "(data->>'key')",
    "collection = 'admin_settings' AND COALESCE(data->>'key', '') <> ''",
  ],
  [
    "eo_documents_submission_gateway_payment_unique_idx",
    "(data->>'gatewayPaymentId')",
    "collection = 'payment_submissions' AND COALESCE(data->>'gatewayPaymentId', '') <> ''",
  ],
  [
    "eo_documents_submission_gateway_checkout_unique_idx",
    "(data->>'gatewayCheckoutSessionId')",
    "collection = 'payment_submissions' AND COALESCE(data->>'gatewayCheckoutSessionId', '') <> ''",
  ],
];

export async function ensurePostgresSchema() {
  await query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

  await query(`
    CREATE TABLE IF NOT EXISTS eo_documents (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (collection, id)
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS eo_documents_data_gin_idx
      ON eo_documents USING GIN (data jsonb_path_ops)
  `);

  for (const [name, expression] of documentIndexes) {
    await query(`CREATE INDEX IF NOT EXISTS ${name} ON eo_documents (${expression})`);
  }

  for (const [name, expression, predicate] of uniqueDocumentIndexes) {
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS ${name} ON eo_documents (${expression}) WHERE ${predicate}`);
  }

  await query(`
    CREATE TABLE IF NOT EXISTS payment_ledger_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      invoice_id TEXT,
      order_id TEXT,
      subscription_id TEXT,
      entry_type TEXT NOT NULL,
      source TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      reference_code TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS payment_ledger_entries_reference_idx
      ON payment_ledger_entries (reference_code, entry_type)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS payment_ledger_entries_user_created_idx
      ON payment_ledger_entries (user_id, created_at DESC)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      status TEXT NOT NULL,
      response JSONB,
      locked_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}
