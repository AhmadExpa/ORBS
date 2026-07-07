# ElevenOrbits

## Contract Signing And Purchase Approval Setup

This repository contains a Next.js frontend in `frontend/` and an Express backend in `backend/`. Customer purchases, Stripe payment creation, wallet invoice payment, renewals, and service access assignment are gated by the current approved Master Services Agreement.

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

3. Fill in database, Clerk, Stripe, Turnstile, Documenso, R2, and internal cron values. Do not commit real `.env` files.

4. Retrieve Documenso template and recipient IDs:
   ```bash
   cd backend
   npm run documenso:list-templates
   ```
   Set `DOCUMENSO_TEMPLATE_ID` and `DOCUMENSO_TEMPLATE_RECIPIENT_ID` in `backend/.env`.

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
