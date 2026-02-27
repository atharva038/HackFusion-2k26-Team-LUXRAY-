/**
 * Tests for the low-stock email alert system.
 *
 * Covers:
 *  1. sendLowStockAlert — email service function
 *  2. checkAndAlertLowStock — scheduler helper
 *  3. POST /api/admin/low-stock-alert — HTTP endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── 1. sendLowStockAlert ─────────────────────────────────────────────────────

describe('sendLowStockAlert', () => {
  let sendMock;
  let sendLowStockAlert;

  beforeEach(async () => {
    sendMock = vi.fn().mockResolvedValue({});

    // Mock nodemailer before importing the module
    vi.doMock('nodemailer', () => ({
      default: {
        createTransport: () => ({ sendMail: sendMock }),
      },
    }));

    // Re-import with mocked nodemailer
    const mod = await import('../agent/service/email.service.agent.js?t=' + Date.now());
    sendLowStockAlert = mod.sendLowStockAlert;
  });

  it('returns error when no recipient emails provided', async () => {
    const result = await sendLowStockAlert([], [{ name: 'Aspirin', stock: 2, lowStockThreshold: 10, unitType: 'tablet' }]);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no recipient/i);
  });

  it('returns error when medicines list is empty', async () => {
    const result = await sendLowStockAlert(['pharma@test.com'], []);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no low-stock/i);
  });

  it('returns error when medicines list is null', async () => {
    const result = await sendLowStockAlert(['pharma@test.com'], null);
    expect(result.success).toBe(false);
  });
});

// ─── 2. sendLowStockAlert email content ──────────────────────────────────────

describe('sendLowStockAlert — email content', () => {
  it('includes medicine names in the HTML body', async () => {
    let capturedOptions = null;
    const sendMock = vi.fn(async (opts) => { capturedOptions = opts; });

    vi.doMock('nodemailer', () => ({
      default: {
        createTransport: () => ({ sendMail: sendMock }),
      },
    }));

    vi.stubEnv('EMAIL_USER', 'system@pharmacy.com');

    const { sendLowStockAlert } = await import('../agent/service/email.service.agent.js?t=' + Date.now() + 'b');

    const medicines = [
      { name: 'Metformin', stock: 3, lowStockThreshold: 50, unitType: 'tablet' },
      { name: 'Amoxicillin', stock: 8, lowStockThreshold: 20, unitType: 'strip' },
    ];

    await sendLowStockAlert(['pharmacist@hospital.com'], medicines);

    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions.to).toBe('pharmacist@hospital.com');
    expect(capturedOptions.subject).toMatch(/low stock/i);
    expect(capturedOptions.html).toContain('Metformin');
    expect(capturedOptions.html).toContain('Amoxicillin');
    expect(capturedOptions.html).toContain('3');   // current stock
    expect(capturedOptions.html).toContain('50');  // threshold
  });

  it('sends to multiple recipients joined by comma', async () => {
    let capturedTo = null;
    vi.doMock('nodemailer', () => ({
      default: {
        createTransport: () => ({
          sendMail: async (opts) => { capturedTo = opts.to; },
        }),
      },
    }));

    const { sendLowStockAlert } = await import('../agent/service/email.service.agent.js?t=' + Date.now() + 'c');
    await sendLowStockAlert(
      ['a@pharmacy.com', 'b@pharmacy.com'],
      [{ name: 'Ibuprofen', stock: 1, lowStockThreshold: 10, unitType: 'tablet' }]
    );
    expect(capturedTo).toBe('a@pharmacy.com, b@pharmacy.com');
  });
});

// ─── 3. checkAndAlertLowStock ─────────────────────────────────────────────────

describe('checkAndAlertLowStock', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns alerted:0 when no medicines are below threshold', async () => {
    vi.doMock('../models/medicine.model.js', () => ({
      default: { find: vi.fn().mockReturnValue({ lean: () => Promise.resolve([]) }) },
    }));
    vi.doMock('../models/user.model.js', () => ({
      default: { find: vi.fn() },
    }));
    vi.doMock('../agent/service/email.service.agent.js', () => ({
      sendLowStockAlert: vi.fn(),
    }));
    vi.doMock('../models/refill.model.js', () => ({
      default: {},
    }));
    vi.doMock('../utils/logger.js', () => ({
      default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock('node-cron', () => ({ default: { schedule: vi.fn() } }));

    const { checkAndAlertLowStock } = await import('../scheduler/refill.scheduler.js?t=' + Date.now());
    const result = await checkAndAlertLowStock();

    expect(result.alerted).toBe(0);
    expect(result.recipients).toBe(0);
  });

  it('returns recipients:0 and skips email when no pharmacists found', async () => {
    const fakeMedicines = [{ name: 'Aspirin', stock: 2, lowStockThreshold: 10, unitType: 'tablet' }];
    const emailMock = vi.fn();

    vi.doMock('../models/medicine.model.js', () => ({
      default: { find: vi.fn().mockReturnValue({ lean: () => Promise.resolve(fakeMedicines) }) },
    }));
    vi.doMock('../models/user.model.js', () => ({
      default: {
        find: vi.fn().mockReturnValue({ select: () => ({ lean: () => Promise.resolve([]) }) }),
      },
    }));
    vi.doMock('../agent/service/email.service.agent.js', () => ({
      sendLowStockAlert: emailMock,
    }));
    vi.doMock('../models/refill.model.js', () => ({ default: {} }));
    vi.doMock('../utils/logger.js', () => ({
      default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock('node-cron', () => ({ default: { schedule: vi.fn() } }));

    const { checkAndAlertLowStock } = await import('../scheduler/refill.scheduler.js?t=' + Date.now() + 'd');
    const result = await checkAndAlertLowStock();

    expect(result.alerted).toBe(1);
    expect(result.recipients).toBe(0);
    expect(emailMock).not.toHaveBeenCalled();
  });

  it('calls sendLowStockAlert with correct emails and medicines', async () => {
    const fakeMedicines = [
      { name: 'Paracetamol', stock: 4, lowStockThreshold: 15, unitType: 'tablet' },
    ];
    const fakePharmacists = [
      { email: 'pharma1@hosp.com' },
      { email: 'pharma2@hosp.com' },
    ];
    const emailMock = vi.fn().mockResolvedValue({ success: true });

    vi.doMock('../models/medicine.model.js', () => ({
      default: { find: vi.fn().mockReturnValue({ lean: () => Promise.resolve(fakeMedicines) }) },
    }));
    vi.doMock('../models/user.model.js', () => ({
      default: {
        find: vi.fn().mockReturnValue({
          select: () => ({ lean: () => Promise.resolve(fakePharmacists) }),
        }),
      },
    }));
    vi.doMock('../agent/service/email.service.agent.js', () => ({
      sendLowStockAlert: emailMock,
    }));
    vi.doMock('../models/refill.model.js', () => ({ default: {} }));
    vi.doMock('../utils/logger.js', () => ({
      default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock('node-cron', () => ({ default: { schedule: vi.fn() } }));

    const { checkAndAlertLowStock } = await import('../scheduler/refill.scheduler.js?t=' + Date.now() + 'e');
    const result = await checkAndAlertLowStock();

    expect(emailMock).toHaveBeenCalledOnce();
    expect(emailMock).toHaveBeenCalledWith(
      ['pharma1@hosp.com', 'pharma2@hosp.com'],
      fakeMedicines
    );
    expect(result.alerted).toBe(1);
    expect(result.recipients).toBe(2);
    expect(result.emailResult.success).toBe(true);
  });

  it('logs error but does not throw when email sending fails', async () => {
    const fakeMedicines = [{ name: 'Insulin', stock: 1, lowStockThreshold: 10, unitType: 'injection' }];
    const fakePharmacists = [{ email: 'admin@pharmacy.com' }];
    const loggerErrorMock = vi.fn();
    const emailMock = vi.fn().mockResolvedValue({ success: false, error: 'SMTP timeout' });

    vi.doMock('../models/medicine.model.js', () => ({
      default: { find: vi.fn().mockReturnValue({ lean: () => Promise.resolve(fakeMedicines) }) },
    }));
    vi.doMock('../models/user.model.js', () => ({
      default: {
        find: vi.fn().mockReturnValue({
          select: () => ({ lean: () => Promise.resolve(fakePharmacists) }),
        }),
      },
    }));
    vi.doMock('../agent/service/email.service.agent.js', () => ({
      sendLowStockAlert: emailMock,
    }));
    vi.doMock('../models/refill.model.js', () => ({ default: {} }));
    vi.doMock('../utils/logger.js', () => ({
      default: { info: vi.fn(), warn: vi.fn(), error: loggerErrorMock },
    }));
    vi.doMock('node-cron', () => ({ default: { schedule: vi.fn() } }));

    const { checkAndAlertLowStock } = await import('../scheduler/refill.scheduler.js?t=' + Date.now() + 'f');

    await expect(checkAndAlertLowStock()).resolves.not.toThrow();
    expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('SMTP timeout'));
  });
});

// ─── 4. POST /api/admin/low-stock-alert — HTTP endpoint ──────────────────────

describe('POST /api/admin/low-stock-alert', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function buildApp(checkAndAlertMock) {
    vi.doMock('../scheduler/refill.scheduler.js', () => ({
      checkAndAlertLowStock: checkAndAlertMock,
      initScheduler: vi.fn(),
    }));
    vi.doMock('../models/medicine.model.js', () => ({ default: {} }));
    vi.doMock('../models/order.model.js', () => ({ default: {} }));
    vi.doMock('../models/refill.model.js', () => ({ default: {} }));
    vi.doMock('../models/user.model.js', () => ({ default: {} }));
    vi.doMock('../models/prescription.model.js', () => ({ default: {} }));
    vi.doMock('../models/inventoryLog.model.js', () => ({ default: {} }));
    vi.doMock('../utils/logger.js', () => ({
      default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));

    const { triggerLowStockAlert } = await import('../controllers/admin.controller.js?t=' + Date.now());
    return triggerLowStockAlert;
  }

  function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  }

  it('returns 200 with message when no medicines are low', async () => {
    const checkMock = vi.fn().mockResolvedValue({ alerted: 0, recipients: 0 });
    const handler = await buildApp(checkMock);

    const req = {};
    const res = mockRes();
    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ alerted: 0, message: expect.stringContaining('above threshold') })
    );
  });

  it('returns 200 with counts when alert is sent', async () => {
    const checkMock = vi.fn().mockResolvedValue({ alerted: 3, recipients: 2, emailResult: { success: true } });
    const handler = await buildApp(checkMock);

    const req = {};
    const res = mockRes();
    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ alerted: 3, recipients: 2 })
    );
  });

  it('returns 500 on unexpected error', async () => {
    const checkMock = vi.fn().mockRejectedValue(new Error('DB connection lost'));
    const handler = await buildApp(checkMock);

    const req = {};
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });
});
