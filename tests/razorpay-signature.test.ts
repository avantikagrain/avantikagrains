import { describe, it, expect } from 'vitest';
import { verifyCheckoutSignature, verifyWebhookSignature } from '@/lib/razorpay';

const KEY_SECRET = 'thisisatestkeysecret';
const WEBHOOK_SECRET = 'whsec_test_value';

const ORDER_ID = 'order_Nx1Ab2Cd3Ef4Gh';
const PAYMENT_ID = 'pay_Nx9Zy8Xw7Vu6Ts';
const VALID_CHECKOUT_SIG =
  'f10b7ad622a9693fa114ec4aab200c25c9fec14935c29a3f5a3c682fdf086174';

const WEBHOOK_BODY = '{"event":"payment.captured","payload":{}}';
const VALID_WEBHOOK_SIG =
  '60d1cd144fda5e40ec55bb6d49e63b385dfba142254288919c96e4fa74a547ad';

describe('checkout handler signature', () => {
  it('accepts a correctly signed payload', () => {
    expect(
      verifyCheckoutSignature(
        {
          razorpay_order_id: ORDER_ID,
          razorpay_payment_id: PAYMENT_ID,
          razorpay_signature: VALID_CHECKOUT_SIG,
        },
        KEY_SECRET,
      ),
    ).toBe(true);
  });

  it('rejects a tampered payment id', () => {
    expect(
      verifyCheckoutSignature(
        {
          razorpay_order_id: ORDER_ID,
          razorpay_payment_id: 'pay_ATTACKER_SUBSTITUTE',
          razorpay_signature: VALID_CHECKOUT_SIG,
        },
        KEY_SECRET,
      ),
    ).toBe(false);
  });

  it('rejects a tampered order id', () => {
    expect(
      verifyCheckoutSignature(
        {
          razorpay_order_id: 'order_SOMEONE_ELSES',
          razorpay_payment_id: PAYMENT_ID,
          razorpay_signature: VALID_CHECKOUT_SIG,
        },
        KEY_SECRET,
      ),
    ).toBe(false);
  });

  it('rejects a signature made with the wrong secret', () => {
    expect(
      verifyCheckoutSignature(
        {
          razorpay_order_id: ORDER_ID,
          razorpay_payment_id: PAYMENT_ID,
          razorpay_signature: VALID_CHECKOUT_SIG,
        },
        'wrong_secret',
      ),
    ).toBe(false);
  });

  it('rejects missing fields instead of throwing', () => {
    expect(
      verifyCheckoutSignature(
        { razorpay_order_id: '', razorpay_payment_id: '', razorpay_signature: '' },
        KEY_SECRET,
      ),
    ).toBe(false);
  });

  it('rejects a signature of the wrong length without throwing', () => {
    expect(() =>
      verifyCheckoutSignature(
        {
          razorpay_order_id: ORDER_ID,
          razorpay_payment_id: PAYMENT_ID,
          razorpay_signature: 'deadbeef',
        },
        KEY_SECRET,
      ),
    ).not.toThrow();
  });
});

describe('webhook signature', () => {
  it('accepts a correctly signed raw body', () => {
    expect(verifyWebhookSignature(WEBHOOK_BODY, VALID_WEBHOOK_SIG, WEBHOOK_SECRET)).toBe(true);
  });

  it('rejects a body that was re-serialised', () => {
    const reSerialised = JSON.stringify(JSON.parse(WEBHOOK_BODY));
    const changed = reSerialised !== WEBHOOK_BODY;

    expect(changed).toBe(false);
    expect(
      verifyWebhookSignature(
        '{ "event": "payment.captured", "payload": {} }',
        VALID_WEBHOOK_SIG,
        WEBHOOK_SECRET,
      ),
    ).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(verifyWebhookSignature(WEBHOOK_BODY, null, WEBHOOK_SECRET)).toBe(false);
  });

  it('rejects the wrong secret', () => {
    expect(verifyWebhookSignature(WEBHOOK_BODY, VALID_WEBHOOK_SIG, 'whsec_other')).toBe(false);
  });

  it('does not accept the checkout signature on a webhook', () => {
    expect(verifyWebhookSignature(WEBHOOK_BODY, VALID_CHECKOUT_SIG, WEBHOOK_SECRET)).toBe(false);
  });

  it('accepts the previous secret during rotation', () => {
    expect(
      verifyWebhookSignature(WEBHOOK_BODY, VALID_WEBHOOK_SIG, 'whsec_new_value', WEBHOOK_SECRET),
    ).toBe(true);
  });
});
