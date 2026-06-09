// components/dashboard/tooltipUtils.accessibility.test.ts
//
// Accessibility Standards & Screen Reader Aria Compliance

import { describe, expect, it } from 'vitest';
import {
  formatTooltipDate,
  getContributionLabel,
  getActivityInsight,
  getStreakLabel,
} from './tooltipUtils';
import type { ActivityData } from '@/types/dashboard';

// Test 1 — Date label is human-readable for aria-label / aria-describedby
describe('formatTooltipDate – accessible date label compliance', () => {
  it('produces a plain-language date string suitable for aria-label or aria-describedby attributes', () => {
    const result = formatTooltipDate('2024-03-15');
    expect(typeof result).toBe('string');
    expect(result.trim().length).toBeGreaterThan(0);
    expect(result).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('null');
    expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
  });

  it('falls back to the raw input string rather than an empty label when the date is invalid', () => {
    const badDate = 'not-a-date';
    const result = formatTooltipDate(badDate);
    expect(typeof result).toBe('string');
    expect(result.trim().length).toBeGreaterThan(0);
    expect(result).toBe(badDate);
    expect(result).not.toContain('[object');
  });
});

// Test 2 — Date output must be safe for aria attributes (no HTML/script injection)
describe('formatTooltipDate – safe output for aria attributes', () => {
  it('produces output free of HTML tags and script characters that would break assistive technology rendering', () => {
    const dates = ['2024-01-01', '2023-12-31', '2025-06-15'];
    for (const date of dates) {
      const result = formatTooltipDate(date);
      expect(result).not.toMatch(/<[^>]+>/);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('javascript:');
      expect(result.trim().length).toBeGreaterThan(0);
    }
  });
});

// Test 3 — Contribution count label correct pluralisation
describe('getContributionLabel – screen-reader-safe pluralisation', () => {
  it('announces singular form for exactly one contribution to avoid grammatically incorrect labels', () => {
    const label = getContributionLabel(1);
    expect(label).toContain('1');
    expect(label).not.toMatch(/1 contributions/i);
    expect(label).toMatch(/1 contribution/i);
  });

  it('announces plural form for zero and multiple contributions', () => {
    expect(getContributionLabel(0)).toMatch(/contributions/i);
    expect(getContributionLabel(5)).toMatch(/contributions/i);
  });

  it('uses the provided translation function for aria-label internationalisation', () => {
    const mockT = (key: string, opts?: Record<string, string>) => {
      if (key === 'dashboard.heatmap.tooltip_single')
        return `${opts?.count ?? ''} contribution on ${opts?.date ?? ''}`;
      if (key === 'dashboard.heatmap.tooltip_plural')
        return `${opts?.count ?? ''} contributions on ${opts?.date ?? ''}`;
      return key;
    };
    const singular = getContributionLabel(1, mockT);
    const plural = getContributionLabel(3, mockT);
    expect(singular).toContain('1');
    expect(singular).not.toMatch(/contributions/i);
    expect(plural).toContain('3');
    expect(plural).toMatch(/contributions/i);
  });
});

// Test 4 — Activity insight returns descriptive prose for aria-describedby
describe('getActivityInsight – descriptive aria-describedby text', () => {
  it('returns a descriptive prose string for each intensity level, never a bare number', () => {
    const intensities: Array<{ count: number; intensity: ActivityData['intensity'] }> = [
      { count: 0, intensity: 0 },
      { count: 1, intensity: 1 },
      { count: 3, intensity: 2 },
      { count: 7, intensity: 3 },
      { count: 12, intensity: 4 },
    ];
    for (const { count, intensity } of intensities) {
      const insight = getActivityInsight(count, intensity);
      expect(typeof insight).toBe('string');
      expect(insight.trim().length).toBeGreaterThan(0);
      expect(insight).not.toMatch(/^\d+$/);
      expect(insight).not.toContain('undefined');
      expect(insight).not.toContain('null');
    }
  });

  it('returns a distinct meaningful message for zero activity so screen readers can announce inactivity clearly', () => {
    const noActivity = getActivityInsight(0, 0);
    expect(noActivity.toLowerCase()).toContain('no activity');
  });

  it('returns peak-activity description for high-intensity days to ensure accurate screen reader announcement', () => {
    const peak = getActivityInsight(10, 4);
    expect(peak.toLowerCase()).toContain('peak');
  });
});

// Test 5 — Streak label correct reading order and safe values
describe('getStreakLabel – aria-compatible streak announcement', () => {
  it('produces a label that announces the streak count before the unit word, following natural reading order', () => {
    const label = getStreakLabel(5);
    expect(typeof label).toBe('string');
    expect(label.trim().length).toBeGreaterThan(0);
    expect(label).toContain('5');
    const numberIndex = label.indexOf('5');
    const dayIndex = label.toLowerCase().indexOf('day');
    expect(dayIndex).toBeGreaterThan(numberIndex);
  });

  it('returns a clear "no streak" label for zero/negative streaks to prevent screen readers announcing misleading values', () => {
    const noStreak = getStreakLabel(0);
    const negativeStreak = getStreakLabel(-1);
    expect(noStreak).not.toMatch(/\d+-day/);
    expect(negativeStreak).not.toMatch(/\d+-day/);
    expect(noStreak.toLowerCase()).toContain('no');
  });

  it('uses the translation function to build internationalised aria-compatible streak labels', () => {
    const mockT = (key: string, opts?: Record<string, string>) => {
      if (key === 'dashboard.heatmap.no_active_streak') return 'No active streak';
      if (key === 'dashboard.heatmap.active_streak')
        return `${opts?.streak ?? ''}-day active streak`;
      return key;
    };
    const noStreak = getStreakLabel(0, mockT);
    const activeStreak = getStreakLabel(7, mockT);
    expect(noStreak).toBe('No active streak');
    expect(activeStreak).toContain('7');
    expect(activeStreak.toLowerCase()).toContain('streak');
  });
});
