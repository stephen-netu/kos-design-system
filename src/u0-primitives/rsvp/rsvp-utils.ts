/**
 * RSVP Utility Functions
 * Handles text segmentation, ORP calculation, and delay mapping for RSVP display
 */

/**
 * Interface for RSVP word data
 */
export interface RsvpWord {
  text: string;
  prefix: string;
  pivot: string;
  suffix: string;
  delayMs: number; // Base delay multiplier for this word
}

/**
 * Calculate Optimal Recognition Point (ORP) position in a word
 * Based on research: ORP is typically left of center, adjusted for word length
 * 
 * @param word - The word to calculate ORP for
 * @returns Index of the ORP character (0-based)
 */
export function calculateOrp(word: string): number {
  const len = word.length;
  
  // ORP positioning based on empirical research:
  // - Very short words (1 char): ORP at position 0
  // - Short words (2-5 chars): ORP at position 1
  // - Medium words (6-9 chars): ORP at position 2
  // - Longer words (10-13 chars): ORP at position 3
  // - Very long words (14+ chars): ORP at position 4
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

/**
 * Segment text into RSVP words with ORP information and delay mapping
 * 
 * @param text - Input text to segment
 * @returns Array of RsvpWord objects ready for RSVP display
 */
export function segmentForRsvp(text: string): RsvpWord[] {
  // Normalize dashes and split on whitespace
  return text
    .replace(/[—–]/g, ' — ') // Normalize em/en dashes to spaces around dash
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(word => {
      const orp = calculateOrp(word);
      
      // Split word into prefix, pivot, suffix based on ORP
      const prefix = word.slice(0, orp);
      const pivot = word[orp] || '';
      const suffix = word.slice(orp + 1);
      
      // Calculate base delay multiplier for this word
      const delayMs = calculateDelay(word);
      
      return {
        text: word,
        prefix,
        pivot,
        suffix,
        delayMs
      };
    });
}

/**
 * Calculate delay multiplier for a word based on complexity
 * Longer words and punctuation get slightly more display time
 * 
 * @param word - The word to calculate delay for
 * @returns Delay multiplier (1.0 = base time)
 */
export function calculateDelay(word: string): number {
  let delay = 1.0;
  
  // Add pause for punctuation at end of word
  if (/[.,;:!?]$/.test(word)) {
    delay += 0.5; // Half unit pause for sentence punctuation
  }
  
  // Add pause for dashes
  if (/[—–]$/.test(word)) {
    delay += 1.0; // Full unit pause for dashes
  }
  
  // Slow down for very long words (over 8 characters)
  if (word.length > 8) {
    delay += 0.3; // Slightly longer for complex words
  }
  
  return delay;
}

/**
 * Calculate actual display time for a word in milliseconds
 * 
 * @param wpm - Words per minute setting
 * @param word - The RSVP word object
 * @returns Display time in milliseconds
 */
export function getWordDisplayTime(wpm: number, word: RsvpWord): number {
  const baseMsPerWord = 60000 / wpm; // Base time per word at given WPM
  return baseMsPerWord * word.delayMs;
}