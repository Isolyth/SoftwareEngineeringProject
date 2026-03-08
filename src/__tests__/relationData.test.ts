import { describe, it, expect } from 'vitest';
import { RELATION_DESCRIPTIONS } from '../relationData';

describe('RELATION_DESCRIPTIONS', () => {
  it('has entries for all three relation types', () => {
    expect(RELATION_DESCRIPTIONS.competitor).toBeDefined();
    expect(RELATION_DESCRIPTIONS.supplier).toBeDefined();
    expect(RELATION_DESCRIPTIONS.partner).toBeDefined();
  });

  it('each type has at least 3 templates', () => {
    expect(RELATION_DESCRIPTIONS.competitor.length).toBeGreaterThanOrEqual(3);
    expect(RELATION_DESCRIPTIONS.supplier.length).toBeGreaterThanOrEqual(3);
    expect(RELATION_DESCRIPTIONS.partner.length).toBeGreaterThanOrEqual(3);
  });

  it('all templates contain {from} or {to} placeholders', () => {
    for (const [type, templates] of Object.entries(RELATION_DESCRIPTIONS)) {
      for (const tmpl of templates) {
        const hasFrom = tmpl.includes('{from}');
        const hasTo = tmpl.includes('{to}');
        expect(hasFrom || hasTo).toBe(true);
      }
    }
  });

  it('templates can be filled with company names', () => {
    for (const [type, templates] of Object.entries(RELATION_DESCRIPTIONS)) {
      for (const tmpl of templates) {
        const filled = tmpl.replace('{from}', 'Appull Inc.').replace('{to}', 'MaxPod Corp.');
        expect(filled).not.toContain('{from}');
        expect(filled).not.toContain('{to}');
        expect(filled.length).toBeGreaterThan(0);
      }
    }
  });
});
