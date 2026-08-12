// Fuzzy Search Utility
// Provides fuzzy matching for products and orders

export interface FuzzyMatch<T> {
  item: T;
  score: number;
  matches: string[];
}

export interface SearchOptions {
  threshold?: number;
  keys?: string[];
  ignoreCase?: boolean;
}

// Levenshtein distance for fuzzy matching
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  
  return dp[m][n];
}

// Calculate fuzzy score between query and target
export function fuzzyScore(query: string, target: string): number {
  if (!query || !target) return 0;
  
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  
  // Exact match
  if (t === q) return 100;
  
  // Contains match
  if (t.includes(q)) {
    const positionBonus = (q.length / t.length) * 50;
    return 80 + positionBonus;
  }
  
  // Word starts with query
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) {
      return 70 + (q.length / word.length) * 20;
    }
  }
  
  // Fuzzy match using Levenshtein
  const distance = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);
  const similarity = 1 - (distance / maxLen);
  
  if (similarity > 0.5) {
    return similarity * 60;
  }
  
  // Character sequence match
  let qIndex = 0;
  let matchCount = 0;
  for (let i = 0; i < t.length && qIndex < q.length; i++) {
    if (t[i] === q[qIndex]) {
      matchCount++;
      qIndex++;
    }
  }
  
  if (qIndex === q.length) {
    return (matchCount / q.length) * 40;
  }
  
  return 0;
}

// Search items with fuzzy matching
export function fuzzySearch<T>(
  items: T[],
  query: string,
  keys: (keyof T | ((item: T) => string))[],
  options: SearchOptions = {}
): FuzzyMatch<T>[] {
  const { threshold = 30, ignoreCase = true } = options;
  
  if (!query || query.trim().length === 0) {
    return items.map(item => ({ item, score: 100, matches: [] }));
  }
  
  const results: FuzzyMatch<T>[] = [];
  
  for (const item of items) {
    let bestScore = 0;
    const matchedKeys: string[] = [];
    
    for (const key of keys) {
      const value = typeof key === 'function' ? key(item) : item[key];
      if (typeof value === 'string') {
        const score = fuzzyScore(query, value);
        if (score > bestScore) {
          bestScore = score;
          matchedKeys.length = 0;
        }
        if (score >= threshold) {
          matchedKeys.push(String(key));
        }
      }
    }
    
    if (bestScore >= threshold) {
      results.push({
        item,
        score: bestScore,
        matches: matchedKeys
      });
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}

// Highlight matched text
export function highlightMatches(text: string, query: string): string {
  if (!query || !text) return text;
  
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  
  // Exact or contains match
  if (t.includes(q)) {
    const regex = new RegExp(`(${escapeRegex(q)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
  
  // Character sequence match
  let result = '';
  let qIndex = 0;
  let inMatch = false;
  
  for (let i = 0; i < text.length; i++) {
    const lowerChar = text[i].toLowerCase();
    if (qIndex < q.length && lowerChar === q[qIndex]) {
      if (!inMatch) {
        result += '<mark>';
        inMatch = true;
      }
      result += text[i];
      qIndex++;
    } else {
      if (inMatch) {
        result += '</mark>';
        inMatch = false;
      }
      result += text[i];
    }
  }
  
  if (inMatch) {
    result += '</mark>';
  }
  
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Debounce utility
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// UseSearch hook for React components
export function useFuzzySearch<T>(
  items: T[],
  query: string,
  keys: (keyof T | ((item: T) => string))[],
  debounceMs: number = 300
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useState(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timeout);
  });
  
  return fuzzySearch(items, debouncedQuery, keys);
}

import { useState } from 'react';
