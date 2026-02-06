import { CustomerPortal } from '@dodopayments/nextjs';

// GET /customer-portal?customer_id=...&send_email=true
export const GET = CustomerPortal({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT, // "test_mode" | "live_mode"
});

