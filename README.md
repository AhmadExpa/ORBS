# ElevenOrbits

## Contract Signing And Purchase Approval Setup

This repository contains a Next.js frontend in `frontend/` and an Express backend in `backend/`. Customer purchases, Stripe payment creation, wallet invoice payment, renewals, and service access assignment are gated by the current approved Managed Service Agreement.

### Development Setup

1. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Create environment files from the examples:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

3. Fill in database, Clerk, Stripe, Turnstile, Documenso, R2, SMTP email, and internal cron values. Do not commit real `.env` files.

4. Retrieve Documenso template and recipient IDs:
   ```bash
   cd backend
   npm run documenso:list-templates
   ```
   Set `DOCUMENSO_TEMPLATE_ID` and `DOCUMENSO_TEMPLATE_RECIPIENT_ID` in `backend/.env`.
   `DOCUMENSO_TEMPLATE_RECIPIENT_ID` can be the recipient `id` returned by Documenso for the template.
   Verify the configured pair without creating a document:
   ```bash
   cd backend
   npm run documenso:verify-template
   ```

5. Configure the optional Documenso webhook to post to:
   ```text
   https://api.elevenorbits.com/api/v1/webhooks/documenso
   ```
   Set `DOCUMENSO_WEBHOOK_SECRET` to the same secret used by Documenso.

6. Verify private R2 access in development:
   ```bash
   cd backend
   npm run r2:test
   ```
   The script only writes under `development-tests/`.

7. Start the backend and frontend:
   ```bash
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

8. Create one test Clerk customer and open `/portal/contracts`.

9. Complete Turnstile and start signing. The backend validates Turnstile before creating a Documenso document.

10. Sign the test contract in Documenso, return to ElevenOrbits, then click sync if needed.

11. Confirm the completed signed PDF, optional audit certificate, and evidence JSON exist in the private R2 bucket under `contracts/{clerkUserId}/{contractId}/`.

12. Sign into `/eo-admin`, open `/eo-admin/contracts`, review the contract details, and approve it.

13. Verify Stripe checkout/order/payment flows are unlocked only after approval.

14. Configure the Stripe webhook endpoint at:
   ```text
   https://api.elevenorbits.com/api/v1/stripe/webhook
   ```
   Include checkout, payment intent, setup intent, and dispute events. At minimum, dispute handling requires `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `charge.dispute.funds_withdrawn`, and `charge.dispute.funds_reinstated`.

15. Verify a second customer cannot access the first customer PDF download endpoint.

16. Verify a non-approved customer cannot call Stripe or order APIs directly; the backend must return `403` with `CONTRACT_APPROVAL_REQUIRED`.

### Existing Signed Agreement Review

Customers who already signed with ElevenOrbits can submit their Documenso document ID and an `https://app.documenso.com` document URL from the Contracts page. The submission moves the agreement to `SIGNED_PENDING_ADMIN`, allowing access to the customer dashboard while payment remains locked.

An administrator must open the submitted URL, verify the document ID, signer, and completed agreement, check the manual-verification confirmation, and approve the contract. Only then does the agreement move to `APPROVED` and unlock payment and activation flows.

### SMTP Notification Verification

Account suspension, blocking, and reactivation attempt to notify the customer's primary email. The admin UI reports a warning when the account action succeeds but the mail server does not accept the notification.

For the current ElevenOrbits cPanel mail host, keep certificate validation enabled and use the provider certificate name:

```text
SMTP_HOST=mail.elevenorbits.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_TLS_REJECT_UNAUTHORIZED=true
SMTP_TLS_SERVERNAME=server313-3.web-hosting.com
```

Verify the SMTP connection without sending a message, or optionally send a clearly labelled test message:

```bash
cd backend
npm run smtp:test
npm run smtp:test -- --send-to your-test-address@example.com
```

### Scheduled Sync

Pending contracts are synced by the backend scheduler every few minutes. A protected manual endpoint is also available for Coolify cron or internal workers:

```bash
curl -X POST "$BACKEND_URL/api/v1/internal/contracts/sync-pending" \
  -H "Authorization: Bearer $INTERNAL_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"limit":25}'
```

### Security Notes

- Rotate any credentials that have been pasted into chat, logs, tickets, or issue trackers before production use.
- Keep the R2 bucket private. Do not configure a public development URL for contract files.
- Documenso and R2 credentials are backend-only. Do not expose them with `NEXT_PUBLIC_` names.
- Normal automated tests mock external services and must not call live Clerk, Stripe, Documenso, Turnstile, or R2 APIs.
