# Payment Flow & Billing

## 1. Where users can start payment

- **Pricing page**  
  User picks Showcase or Spotlight. If they came from Submit with a project, checkout runs for that project (or we show “already on plan”). Otherwise we open “Choose project” → then checkout.

- **Submit page (last step – Promote)**  
  User picks Free or Paid (Showcase/Spotlight).  
  - **Free:** Project is created as launched → redirect to launch page.  
  - **Paid:** Project is created as launched → redirect to Pricing with `projectId` and `plan` → checkout from there (or “already on plan” if that project is already on that plan).

So payment can be started from **Pricing** or from **Submit** (by choosing a paid plan and then being sent to Pricing with `projectId`).

---

## 2. Upgrade / downgrade (Showcase ↔ Spotlight)

- **Upgrade (e.g. Showcase → Spotlight):** Pricing → select Spotlight → same project → checkout → webhook updates that project to Spotlight.
- **Downgrade (e.g. Spotlight → Showcase):** Same flow with Showcase selected.
- **Cancel to Free:** Settings → Manage billing (Dodo portal). Dodo sends `subscription_cancelled` / `subscription_expired`; our webhook sets the project back to Free.

---

## 3. No double-pay for the same plan

- **API:** `/api/checkout` loads the project’s `plan_type` and `subscription_status`. If the project is already on the same plan and status is `active` (or `trialing`), it returns **400** with a message like: “This project is already on [Plan]. Use Settings → Manage billing…”.
- **Pricing page:** When landing with `projectId` and `plan` in the URL, we fetch that project first. If it’s already on that plan and active, we don’t call checkout; we set `alreadyOnPlanMessage` and show a banner with a link to Settings. If the user still hits checkout (e.g. from the modal), the API returns 400 and we show the same message.

---

## 4. Settings: how we show plan and build the customer portal link

- **Which project we use**  
  We first look for a project that has an **active paid plan** (Showcase or Spotlight and `subscription_status` in `active` / `trialing`).  
  If we find one, we use it for the plan label and for `dodo_customer_id`.  
  If we don’t, we fall back to the **latest project** (by `created_at`).  
  So Settings shows “Showcase” or “Spotlight” when the user has a paid project, and “Standard” when the selected project is Free or has no plan.

- **Manage billing link**  
  The link is built as:  
  `/customer-portal?customer_id=<dodo_customer_id>`  
  when we have `dodo_customer_id` on that project.  
  `dodo_customer_id` is set by the **webhook** when Dodo sends payment/subscription events (we read it from the payload and store it on the project).  
  If the project has no `dodo_customer_id` (e.g. older projects), the link is still `/customer-portal` and we show a short note that they can contact support if the portal doesn’t work.

- **Customer portal route**  
  `GET /customer-portal?customer_id=...` is handled by Dodo’s Next.js `CustomerPortal` handler. It forwards the request to Dodo with the given `customer_id`.  
  **Optional hardening:** you can add a server-side check that the logged-in user owns a project with that `dodo_customer_id` before calling Dodo, so users can’t open another user’s portal by guessing `customer_id`.

---

## 5. Submit flow: free vs paid

- For **both** free and paid we create the project with `status: 'launched'`. So the project is live as soon as they finish Submit; paid only adds Showcase/Spotlight after payment.
- Draft is only when they “Save draft” without completing Submit.

---

## 6. Emails (renewal reminder)

- Check whether Dodo already sends renewal / payment reminder emails. If yes, you may not need your own.
- If you want your own “renewal in X days” email: add a cron or scheduled job that finds projects where `current_period_end` is in 3–7 days and `subscription_status = 'active'`, and send one reminder per project per period (e.g. store `renewal_reminder_sent_at` to avoid duplicates).

---

## 7. What we store on each project (subscription data)

We keep these on **`projects`** so Settings and the app can show plan, portal link, and renewal info:

| Field | Meaning | Where it comes from |
|-------|--------|----------------------|
| **plan_type** | Showcase / Spotlight / Free | Webhook payload `data.metadata.planType` (or our mapping). |
| **subscription_status** | active / trialing / cancelled / expired | Webhook payload, or Dodo API if we fetch subscription. |
| **subscription_id** | Dodo subscription id (e.g. sub_xxx) | Webhook payload `data.subscription_id`. |
| **current_period_end** | When the current billing period ends (ISO date) | Webhook payload if present; otherwise we **fetch the subscription from Dodo API** when we have `subscription_id` and use the period end from the response. |
| **cancel_at_period_end** | Whether the user chose to cancel at period end | Webhook or Dodo API. |
| **dodo_customer_id** | Dodo customer id (e.g. cus_xxx) for the portal link | Webhook payload `data.customer.customer_id`, or from Dodo API subscription response if missing. |

- **When subscription starts:** As soon as the first payment webhook is processed (or we fetch the subscription), we set plan, status, subscription_id, and, when available, current_period_end and dodo_customer_id.
- **Days remaining / Next payment:** Settings computes them from **current_period_end** (days until that date, and the date as “Next payment”). If current_period_end is null, we show “—” until we get it from a webhook or from the Dodo API fetch.
- **If the webhook has no period end:** The webhook handler calls Dodo’s **GET subscription** API (using `DODO_PAYMENTS_API_KEY` and optional `DODO_PAYMENTS_API_URL`) and fills in current_period_end, customer_id, status, and cancel_at_period_end from the response. So you get subscription type, days, and next payment once the API returns that data.

Optional env for API base URL: **`DODO_PAYMENTS_API_URL`** (default `https://api.dodopayments.com`). Use it if Dodo gives you a different base URL for test/live.

---

## 8. Migration and backfill

- Run **`startuphunt/supabase-migrations/add-dodo-customer-id.sql`** in the Supabase SQL Editor so `projects.dodo_customer_id` exists.
- For existing paid projects that don’t have `dodo_customer_id` yet, backfill once from the Dodo payload (e.g. from a past webhook or dashboard), e.g.:  
  `UPDATE public.projects SET dodo_customer_id = 'cus_xxx' WHERE id = ? AND user_id = ?;`
