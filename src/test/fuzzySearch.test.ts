import { describe, it, expect } from 'vitest';
import { fuzzyScore, fuzzySearch, highlightMatches, levenshteinDistance } from '../../utils/fuzzySearch';

describe('fuzzySearch', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    it('should return correct distance for different strings', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    });

    it('should handle empty strings', () => {
      expect(levenshteinDistance('', 'hello')).toBe(5);
      expect(levenshteinDistance('hello', '')).toBe(5);
    });
  });

  describe('fuzzyScore', () => {
    it('should return 100 for exact match', () => {
      expect(fuzzyScore('hello', 'hello')).toBe(100);
    });

    it('should return high score for contains match', () => {
      const score = fuzzyScore('hello', 'hello world');
      expect(score).toBeGreaterThan(80);
    });

    it('should return 0 for no match', () => {
      expect(fuzzyScore('xyz', 'abc')).toBe(0);
    });

    it('should be case insensitive', () => {
      expect(fuzzyScore('HELLO', 'hello')).toBe(100);
    });
  });

  describe('fuzzySearch', () => {
    const items = [
      { id: 1, name: 'YETI Tumbler', brand: 'YETI' },
      { id: 2, name: 'Stanley Bottle', brand: 'Stanley' },
      { id: 3, name: 'HydroFlask Mug', brand: 'HydroFlask' },
    ];

    it('should return all items for empty query', () => {
      const results = fuzzySearch(items, '', ['name']);
      expect(results).toHaveLength(3);
    });

    it('should find items by name', () => {
      const results = fuzzySearch(items, 'yeti', ['name']);
      expect(results).toHaveLength(1);
      expect(results[0].item.name).toBe('YETI Tumbler');
    });

    it('should find items by brand', () => {
      const results = fuzzySearch(items, 'stanley', ['brand', 'name']);
      expect(results).toHaveLength(1);
      expect(results[0].item.brand).toBe('Stanley');
    });

    it('should return results sorted by score', () => {
      const results = fuzzySearch(items, 'tumbler', ['name']);
      expect(results[0].item.name).toBe('YETI Tumbler');
    });

    it('should respect threshold option', () => {
      const results = fuzzySearch(items, 'xyz', ['name'], { threshold: 50 });
      expect(results).toHaveLength(0);
    });
  });

  describe('highlightMatches', () => {
    it('should wrap exact match in mark tags', () => {
      const result = highlightMatches('Hello World', 'Hello');
      expect(result).toBe('<mark>Hello</mark> World');
    });

    it('should handle no match', () => {
      const result = highlightMatches('Hello World', 'xyz');
      expect(result).toBe('Hello World');
    });

    it('should be case insensitive', () => {
      const result = highlightMatches('Hello World', 'hello');
      expect(result).toBe('<mark>Hello</mark> World');
    });
  });
});
