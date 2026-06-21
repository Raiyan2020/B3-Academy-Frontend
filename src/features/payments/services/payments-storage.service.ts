'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { CurrencyCode } from '@/features/business/business.types';
import { addNotification } from '@/features/account/services/account-records.service';
import type { PaymentFailureReason, PaymentIntent, PaymentKind, PaymentRecord } from '../types/payment.types';

const PAYMENT_RECORDS_KEY = 'b3-payment-records';
const PAYMENT_INTENTS_KEY = 'b3-payment-intents';

export function getPaymentRecords(userId?: string) {
  const all = readLocalStorageJson<PaymentRecord[]>(PAYMENT_RECORDS_KEY, []);
  return userId ? all.filter((record) => record.userId === userId) : all;
}

export function getPaymentIntents(userId?: string) {
  const all = readLocalStorageJson<PaymentIntent[]>(PAYMENT_INTENTS_KEY, []);
  return userId ? all.filter((intent) => intent.userId === userId) : all;
}

export function createPaymentIntent(input: {
  userId: string;
  kind: PaymentKind;
  itemId: string;
  itemName: string;
  amount: number;
  currency: CurrencyCode;
  method?: string;
  relatedBookingId?: string;
}) {
  const now = new Date().toISOString();
  const intent: PaymentIntent = {
    id: `pi-${Date.now()}`,
    userId: input.userId,
    kind: input.kind,
    itemId: input.itemId,
    itemName: input.itemName,
    amount: input.amount,
    currency: input.currency,
    method: input.method || 'card',
    status: 'review',
    createdAt: now,
    relatedBookingId: input.relatedBookingId,
  };

  writeLocalStorageJson(PAYMENT_INTENTS_KEY, [intent, ...getPaymentIntents()]);
  return intent;
}

export function markPaymentIntentProcessing(intentId: string) {
  return updatePaymentIntent(intentId, { status: 'processing' });
}

export function failPaymentIntent(intentId: string, failureReason: PaymentFailureReason = 'gateway-declined') {
  const intent = updatePaymentIntent(intentId, { status: 'failed', failureReason });
  if (intent) {
    createPaymentRecordFromIntent(intent, 'failed', failureReason);
  }
  return intent;
}

export function cancelPaymentIntent(intentId: string) {
  const intent = updatePaymentIntent(intentId, { status: 'cancelled', failureReason: 'user-cancelled' });
  if (intent) {
    createPaymentRecordFromIntent(intent, 'cancelled', 'user-cancelled');
  }
  return intent;
}

export function completePaymentIntent(intentId: string) {
  const intent = updatePaymentIntent(intentId, { status: 'successful' });
  if (!intent) return null;
  return createPaymentRecordFromIntent(intent, 'successful');
}

export function createSuccessfulPayment(input: {
  userId: string;
  kind: PaymentKind;
  itemId: string;
  itemName: string;
  amount: number;
  currency: CurrencyCode;
  method?: string;
}) {
  const intent = createPaymentIntent(input);
  return createPaymentRecordFromIntent({ ...intent, status: 'successful' }, 'successful');
}

function updatePaymentIntent(intentId: string, patch: Partial<PaymentIntent>) {
  const all = getPaymentIntents();
  let updated: PaymentIntent | null = null;
  const next = all.map((intent) => {
    if (intent.id !== intentId) return intent;
    updated = { ...intent, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  writeLocalStorageJson(PAYMENT_INTENTS_KEY, next);
  return updated;
}

function createPaymentRecordFromIntent(intent: PaymentIntent, status: PaymentRecord['status'], failureReason?: PaymentFailureReason) {
  const now = new Date().toISOString();
  const id = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record: PaymentRecord = {
    id,
    userId: intent.userId,
    kind: intent.kind,
    itemId: intent.itemId,
    itemName: intent.itemName,
    amount: intent.amount,
    currency: intent.currency,
    method: intent.method,
    status,
    createdAt: intent.createdAt,
    updatedAt: now,
    failureReason,
    gatewayReference: status === 'successful' ? `local-gateway-${intent.id}` : undefined,
    receiptEmailSentAt: status === 'successful' ? now : undefined,
    relatedBookingId: intent.relatedBookingId,
    invoice:
      status === 'successful'
        ? {
            id: `inv-${Date.now()}`,
            paymentId: id,
            issuedAt: now,
            downloadUrl: createInvoiceDataUrl({
              invoiceId: `inv-${Date.now()}`,
              paymentId: id,
              itemName: intent.itemName,
              amount: intent.amount,
              currency: intent.currency,
              method: intent.method,
              issuedAt: now,
            }),
            status: 'issued',
          }
        : undefined,
  };

  const records = getPaymentRecords();
  writeLocalStorageJson(PAYMENT_RECORDS_KEY, [record, ...records]);
  addNotification({
    userId: record.userId,
    title: status === 'successful' ? 'تمت عملية الدفع بنجاح' : 'لم تكتمل عملية الدفع',
    body:
      status === 'successful'
        ? `تم إصدار فاتورة لعملية ${record.itemName}.`
        : `عملية ${record.itemName} لم تكتمل ويمكنك المحاولة مرة أخرى.`,
    href: '/dashboard/payments',
  });
  return record;
}

function createInvoiceDataUrl(input: {
  invoiceId: string;
  paymentId: string;
  itemName: string;
  amount: number;
  currency: CurrencyCode;
  method: string;
  issuedAt: string;
}) {
  const formattedDate = new Date(input.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${input.invoiceId}</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      box-sizing: border-box;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .logo-area h1 {
      font-size: 24px;
      color: #064e3b;
      margin: 0 0 4px 0;
      font-weight: 800;
    }
    .logo-area p {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      font-size: 28px;
      color: #0f172a;
      margin: 0 0 8px 0;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }
    .meta-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin: 0 0 8px 0;
    }
    .meta-section p {
      font-size: 14px;
      color: #334155;
      margin: 0 0 4px 0;
      line-height: 1.5;
    }
    .table-container {
      margin-bottom: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      padding: 12px 16px;
      border-bottom: 2px solid #e2e8f0;
      background: #f8fafc;
    }
    td {
      font-size: 14px;
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .total-row td {
      border-bottom: none;
      font-weight: bold;
      font-size: 16px;
      color: #0f172a;
      background: #f8fafc;
    }
    .footer {
      text-align: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
      margin-top: 40px;
      font-size: 12px;
      color: #94a3b8;
    }
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .invoice-card {
        box-shadow: none;
        border: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="logo-area">
        <h1>B3 ACADEMY</h1>
        <p>Expert Education & Healthcare Services</p>
      </div>
      <div class="invoice-title">
        <h2>INVOICE</h2>
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #475569;"># ${input.invoiceId}</p>
      </div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-section">
        <h3>Billed To</h3>
        <p><strong>B3 Academy Student / Client</strong></p>
        <p>Payment Reference: ${input.paymentId}</p>
        <p>Method: ${input.method.toUpperCase()}</p>
      </div>
      <div class="meta-section" style="text-align: right;">
        <h3>Date Issued</h3>
        <p>${formattedDate}</p>
      </div>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: bold; color: #0f172a;">${input.itemName}</td>
            <td style="text-align: right; font-weight: bold; color: #0f172a;">${input.amount.toFixed(2)} ${input.currency.toUpperCase()}</td>
          </tr>
          <tr class="total-row">
            <td style="text-align: right;">Total Paid</td>
            <td style="text-align: right; color: #064e3b;">${input.amount.toFixed(2)} ${input.currency.toUpperCase()}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>Thank you for choosing B3 Academy. Your payment has been successfully processed.</p>
      <p style="margin-top: 8px;">For support or inquiries, please email support@b3academy.com</p>
    </div>
  </div>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
