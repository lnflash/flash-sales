// Utility functions for search functionality

// Escape special characters for PostgreSQL LIKE/ILIKE queries
export function escapeSearchTerm(term: string): string {
  // Escape special characters that have meaning in LIKE patterns
  return term
    .replace(/\\/g, '\\\\')  // Escape backslash first
    .replace(/%/g, '\\%')     // Escape percent
    .replace(/_/g, '\\_')     // Escape underscore
    .replace(/'/g, "''");     // Escape single quotes for SQL
}

// Normalize search term for better matching
export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');   // Replace multiple spaces with single space
}

// Split search term into words for flexible matching
export function getSearchWords(term: string): string[] {
  return normalizeSearchTerm(term)
    .split(' ')
    .filter(word => word.length > 0);
}

// Build a flexible search pattern that matches any order of words
export function buildFlexibleSearchPattern(term: string): string {
  const words = getSearchWords(term);
  if (words.length === 0) return '';
  
  // For single word, just return it
  if (words.length === 1) {
    return escapeSearchTerm(words[0]);
  }
  
  // For multiple words, create a pattern that matches all words in any order
  // This creates: word1%word2 | word2%word1 for all permutations
  return words.map(word => escapeSearchTerm(word)).join('%');
}