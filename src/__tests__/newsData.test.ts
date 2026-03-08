import { describe, it, expect } from 'vitest';
import { getNewsForDay } from '../newsData';

describe('getNewsForDay', () => {
  it('returns articles for day 1', () => {
    const news = getNewsForDay(1);
    expect(Array.isArray(news)).toBe(true);
    expect(news.length).toBeGreaterThan(0);
  });

  it('returns articles for day 7', () => {
    const news = getNewsForDay(7);
    expect(news.length).toBeGreaterThan(0);
  });

  it('articles have required fields', () => {
    for (let day = 1; day <= 7; day++) {
      const news = getNewsForDay(day);
      for (const article of news) {
        expect(typeof article.headline).toBe('string');
        expect(article.headline.length).toBeGreaterThan(0);
        expect(typeof article.blurb).toBe('string');
        expect(article.blurb.length).toBeGreaterThan(0);
        expect(Array.isArray(article.tags)).toBe(true);
        expect(article.tags.length).toBeGreaterThan(0);
      }
    }
  });

  it('all tags are 4-letter uppercase tickers', () => {
    for (let day = 1; day <= 7; day++) {
      const news = getNewsForDay(day);
      for (const article of news) {
        for (const tag of article.tags) {
          expect(tag).toMatch(/^[A-Z]{4}$/);
        }
      }
    }
  });

  it('clamps to last day for out-of-range days', () => {
    const day7 = getNewsForDay(7);
    const day99 = getNewsForDay(99);
    expect(day99).toEqual(day7);
  });

  it('each day has 3 news articles', () => {
    for (let day = 1; day <= 7; day++) {
      const news = getNewsForDay(day);
      expect(news.length).toBe(3);
    }
  });
});
