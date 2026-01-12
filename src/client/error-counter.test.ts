import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorCounter, getErrorCounter, resetErrorCounter } from './error-counter.js';
import { EcountErrorLimitError } from '../utils/errors.js';

// Logger 모킹
vi.mock('../utils/logger.js', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ErrorCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetErrorCounter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should use default values', () => {
      const counter = new ErrorCounter();
      const status = counter.getStatus();
      expect(status.maxErrors).toBe(30);
      expect(status.warningThreshold).toBe(25);
    });

    it('should accept custom options', () => {
      const counter = new ErrorCounter({
        maxErrors: 50,
        warningThreshold: 40,
        resetIntervalMs: 30 * 60 * 1000,
      });
      const status = counter.getStatus();
      expect(status.maxErrors).toBe(50);
      expect(status.warningThreshold).toBe(40);
    });
  });

  describe('recordError', () => {
    it('should increment error count', () => {
      const counter = new ErrorCounter();
      expect(counter.getCount()).toBe(0);
      counter.recordError();
      expect(counter.getCount()).toBe(1);
      counter.recordError();
      expect(counter.getCount()).toBe(2);
    });

    it('should throw EcountErrorLimitError when threshold reached', () => {
      const counter = new ErrorCounter({ warningThreshold: 3 });
      counter.recordError(); // 1
      counter.recordError(); // 2
      expect(() => counter.recordError()).toThrow(EcountErrorLimitError); // 3
    });

    it('should include error count in thrown error', () => {
      const counter = new ErrorCounter({ warningThreshold: 2 });
      counter.recordError(); // 1
      try {
        counter.recordError(); // 2 - should throw
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EcountErrorLimitError);
        expect((error as EcountErrorLimitError).errorCount).toBe(2);
      }
    });

    it('should not throw before threshold', () => {
      const counter = new ErrorCounter({ warningThreshold: 25 });
      for (let i = 0; i < 24; i++) {
        expect(() => counter.recordError()).not.toThrow();
      }
      expect(counter.getCount()).toBe(24);
    });
  });

  describe('recordSuccess', () => {
    it('should reset error count to zero', () => {
      const counter = new ErrorCounter();
      counter.recordError();
      counter.recordError();
      expect(counter.getCount()).toBe(2);
      counter.recordSuccess();
      expect(counter.getCount()).toBe(0);
    });

    it('should do nothing when count is already zero', () => {
      const counter = new ErrorCounter();
      expect(counter.getCount()).toBe(0);
      counter.recordSuccess();
      expect(counter.getCount()).toBe(0);
    });

    it('should allow new errors after reset', () => {
      const counter = new ErrorCounter({ warningThreshold: 3 });
      counter.recordError();
      counter.recordError();
      counter.recordSuccess();
      // Should be able to record errors again
      expect(() => counter.recordError()).not.toThrow();
      expect(() => counter.recordError()).not.toThrow();
    });
  });

  describe('auto-reset', () => {
    it('should reset after resetIntervalMs', () => {
      const counter = new ErrorCounter({ resetIntervalMs: 60000 }); // 1 minute
      counter.recordError();
      counter.recordError();
      expect(counter.getCount()).toBe(2);

      // Advance time by 61 seconds
      vi.advanceTimersByTime(61000);

      expect(counter.getCount()).toBe(0);
    });

    it('should not reset before resetIntervalMs', () => {
      const counter = new ErrorCounter({ resetIntervalMs: 60000 });
      counter.recordError();
      counter.recordError();

      // Advance time by 59 seconds
      vi.advanceTimersByTime(59000);

      expect(counter.getCount()).toBe(2);
    });

    it('should reset on recordError call after interval', () => {
      const counter = new ErrorCounter({
        resetIntervalMs: 60000,
        warningThreshold: 3,
      });
      counter.recordError();
      counter.recordError();

      vi.advanceTimersByTime(61000);

      // This should not throw because auto-reset happened
      expect(() => counter.recordError()).not.toThrow();
      expect(counter.getCount()).toBe(1);
    });

    it('should use default 1 hour interval', () => {
      const counter = new ErrorCounter();
      counter.recordError();

      // Advance 59 minutes
      vi.advanceTimersByTime(59 * 60 * 1000);
      expect(counter.getCount()).toBe(1);

      // Advance past 1 hour
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(counter.getCount()).toBe(0);
    });
  });

  describe('canProceed', () => {
    it('should return true when below threshold', () => {
      const counter = new ErrorCounter({ warningThreshold: 10 });
      for (let i = 0; i < 5; i++) {
        counter.recordError();
      }
      expect(counter.canProceed()).toBe(true);
    });

    it('should return false when at threshold', () => {
      const counter = new ErrorCounter({ warningThreshold: 5 });
      // Record 4 errors (threshold is 5, so 5th would throw)
      for (let i = 0; i < 4; i++) {
        counter.recordError();
      }
      expect(counter.canProceed()).toBe(true);

      // Record 5th (threshold)
      try {
        counter.recordError();
      } catch {
        // Expected
      }
      expect(counter.canProceed()).toBe(false);
    });

    it('should return true after auto-reset', () => {
      const counter = new ErrorCounter({
        warningThreshold: 5,
        resetIntervalMs: 60000,
      });
      // Fill up to threshold
      for (let i = 0; i < 4; i++) {
        counter.recordError();
      }
      try {
        counter.recordError();
      } catch {
        // Expected
      }
      expect(counter.canProceed()).toBe(false);

      // Advance past reset interval
      vi.advanceTimersByTime(61000);
      expect(counter.canProceed()).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should return correct status object', () => {
      const counter = new ErrorCounter({
        maxErrors: 30,
        warningThreshold: 25,
        resetIntervalMs: 3600000,
      });
      counter.recordError();

      const status = counter.getStatus();
      expect(status.errorCount).toBe(1);
      expect(status.maxErrors).toBe(30);
      expect(status.warningThreshold).toBe(25);
      expect(status.canProceed).toBe(true);
      expect(status.nextResetAt).toBeInstanceOf(Date);
    });

    it('should calculate correct nextResetAt', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const counter = new ErrorCounter({ resetIntervalMs: 3600000 }); // 1 hour

      const status = counter.getStatus();
      expect(status.nextResetAt.toISOString()).toBe('2024-01-01T01:00:00.000Z');
    });

    it('should update nextResetAt after reset', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const counter = new ErrorCounter({ resetIntervalMs: 3600000 });

      // Advance 2 hours
      vi.advanceTimersByTime(2 * 3600000);
      vi.setSystemTime(new Date('2024-01-01T02:00:00Z'));

      counter.getCount(); // Triggers auto-reset

      const status = counter.getStatus();
      expect(status.nextResetAt.toISOString()).toBe('2024-01-01T03:00:00.000Z');
    });
  });

  describe('reset', () => {
    it('should reset count to zero', () => {
      const counter = new ErrorCounter();
      counter.recordError();
      counter.recordError();
      counter.reset();
      expect(counter.getCount()).toBe(0);
    });

    it('should update lastResetTime', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const counter = new ErrorCounter({ resetIntervalMs: 3600000 });

      vi.setSystemTime(new Date('2024-01-01T02:00:00Z'));
      counter.reset();

      const status = counter.getStatus();
      expect(status.nextResetAt.toISOString()).toBe('2024-01-01T03:00:00.000Z');
    });

    it('should allow errors again after manual reset', () => {
      const counter = new ErrorCounter({ warningThreshold: 2 });
      counter.recordError();
      try {
        counter.recordError(); // Throws
      } catch {
        // Expected
      }

      counter.reset();

      // Should be able to record errors again
      expect(() => counter.recordError()).not.toThrow();
    });
  });

  describe('singleton', () => {
    it('should return same instance from getErrorCounter', () => {
      const counter1 = getErrorCounter();
      const counter2 = getErrorCounter();
      expect(counter1).toBe(counter2);
    });

    it('should create new instance after resetErrorCounter', () => {
      const counter1 = getErrorCounter();
      counter1.recordError();
      expect(counter1.getCount()).toBe(1);

      resetErrorCounter();

      const counter2 = getErrorCounter();
      expect(counter2.getCount()).toBe(0);
      expect(counter2).not.toBe(counter1);
    });

    it('should reset count in existing instance when resetErrorCounter called', () => {
      const counter = getErrorCounter();
      counter.recordError();
      counter.recordError();

      resetErrorCounter();

      // New instance should start fresh
      const newCounter = getErrorCounter();
      expect(newCounter.getCount()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle warningThreshold of 1', () => {
      const counter = new ErrorCounter({ warningThreshold: 1 });
      expect(() => counter.recordError()).toThrow(EcountErrorLimitError);
    });

    it('should handle very large error counts', () => {
      const counter = new ErrorCounter({ warningThreshold: 1000 });
      for (let i = 0; i < 999; i++) {
        counter.recordError();
      }
      expect(counter.getCount()).toBe(999);
      expect(counter.canProceed()).toBe(true);
    });

    it('should handle rapid succession of errors and successes', () => {
      const counter = new ErrorCounter({ warningThreshold: 10 });

      counter.recordError();
      counter.recordError();
      counter.recordSuccess();
      counter.recordError();
      counter.recordError();
      counter.recordError();
      counter.recordSuccess();
      counter.recordError();

      expect(counter.getCount()).toBe(1);
    });
  });
});
