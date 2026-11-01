import { MatchReasonMetrics } from '../types/index.js';

/**
 * Compute the Levenshtein edit distance between two strings
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const str1 = (s1 || '').trim().toLowerCase();
  const str2 = (s2 || '').trim().toLowerCase();

  const m = str1.length;
  const n = str2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,     // deletion
        d[i][j - 1] + 1,     // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Normalized Levenshtein similarity ratio between 0.0 and 1.0
 */
export function levenshteinSimilarity(s1: string, s2: string): number {
  const str1 = (s1 || '').trim().toLowerCase();
  const str2 = (s2 || '').trim().toLowerCase();
  if (!str1 && !str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  if (str1 === str2) return 1.0;

  const maxLen = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1, str2);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Jaro-Winkler string similarity algorithm (0.0 to 1.0)
 * Highly optimized for proper names and typos near the start of surnames
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  const str1 = (s1 || '').trim().toLowerCase();
  const str2 = (s2 || '').trim().toLowerCase();

  if (str1 === str2) return 1.0;
  if (!str1.length || !str2.length) return 0.0;

  const matchDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, str2.length);

    for (let j = start; j < end; j++) {
      if (str2Matches[j]) continue;
      if (str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / str1.length +
      matches / str2.length +
      (matches - transpositions / 2) / matches) /
    3;

  // Winkler prefix scaling: up to 4 prefix characters
  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  const p = 0.1; // standard scaling factor
  return Math.min(1.0, jaro + prefix * p * (1 - jaro));
}

/**
 * American Soundex Phonetic Encoding
 * Returns 4-character code (e.g. "Vance" -> "V520")
 */
export function soundex(word: string): string {
  const w = (word || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!w) return '0000';

  const map: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6'
  };

  const firstLetter = w[0];
  let encoded = firstLetter;
  let prevCode = map[firstLetter] || '0';

  for (let i = 1; i < w.length; i++) {
    const char = w[i];
    const code = map[char] || '0';

    if (code !== '0' && code !== prevCode) {
      encoded += code;
    }
    prevCode = code;
    if (encoded.length === 4) break;
  }

  return encoded.padEnd(4, '0');
}

/**
 * Metaphone Phonetic Encoding
 * Captures English phonetic pronunciation rules
 */
export function metaphone(word: string): string {
  let str = (word || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!str) return '';

  // Drop initial silent letters
  if (['KN', 'GN', 'PN', 'AE', 'WR'].some(prefix => str.startsWith(prefix))) {
    str = str.substring(1);
  } else if (str.startsWith('X')) {
    str = 'S' + str.substring(1);
  } else if (str.startsWith('WH')) {
    str = 'W' + str.substring(2);
  }

  let code = '';
  const len = str.length;

  for (let i = 0; i < len; i++) {
    const c = str[i];
    const next = i + 1 < len ? str[i + 1] : '';
    const prev = i > 0 ? str[i - 1] : '';

    // Ignore duplicate adjacent characters, except 'C'
    if (c === prev && c !== 'C') continue;

    // Vowels at the beginning retain 'A', others are silent
    if (['A', 'E', 'I', 'O', 'U', 'Y'].includes(c)) {
      if (i === 0) code += c;
      continue;
    }

    switch (c) {
      case 'B':
        if (prev === 'M' && i === len - 1) break; // silent B in dumb
        code += 'B';
        break;
      case 'C':
        if (next === 'H') {
          code += 'X'; // ch sound
          i++;
        } else if (['I', 'E', 'Y'].includes(next)) {
          code += 'S';
        } else {
          code += 'K';
        }
        break;
      case 'D':
        if (next === 'G' && ['E', 'I', 'Y'].includes(i + 2 < len ? str[i + 2] : '')) {
          code += 'J';
          i++;
        } else {
          code += 'T';
        }
        break;
      case 'G':
        if (next === 'H' && i + 2 === len) break; // silent GH at end
        if (['I', 'E', 'Y'].includes(next)) code += 'J';
        else code += 'K';
        break;
      case 'H':
        if (['A', 'E', 'I', 'O', 'U', 'Y'].includes(next) && !['C', 'S', 'P', 'T', 'G'].includes(prev)) {
          code += 'H';
        }
        break;
      case 'K':
        if (prev !== 'C') code += 'K';
        break;
      case 'P':
        if (next === 'H') {
          code += 'F';
          i++;
        } else {
          code += 'P';
        }
        break;
      case 'Q':
        code += 'K';
        break;
      case 'S':
        if (next === 'H') {
          code += 'X';
          i++;
        } else {
          code += 'S';
        }
        break;
      case 'T':
        if (next === 'H') {
          code += '0'; // th sound
          i++;
        } else if (next === 'I' && (i + 2 < len && ['A', 'O'].includes(str[i + 2]))) {
          code += 'X';
        } else {
          code += 'T';
        }
        break;
      case 'V':
        code += 'F';
        break;
      case 'W':
      case 'Y':
        if (['A', 'E', 'I', 'O', 'U', 'Y'].includes(next)) code += c;
        break;
      case 'X':
        code += 'KS';
        break;
      case 'Z':
        code += 'S';
        break;
      default:
        code += c;
    }
  }

  return code;
}

/**
 * Compare two geographic birthplace strings
 * Handles: "County Cork, Ireland" vs "Cork, Ireland" or "Boston, MA" vs "Boston, Massachusetts"
 */
export function birthplaceSimilarity(place1?: string | null, place2?: string | null): number {
  if (!place1 || !place2) return 0.5; // neutral if missing
  const clean1 = place1.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
  const clean2 = place2.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();

  if (clean1 === clean2) return 1.0;

  // Direct string similarity
  const stringSim = Math.max(jaroWinklerSimilarity(clean1, clean2), levenshteinSimilarity(clean1, clean2));

  // Token overlap (e.g. Cork in "County Cork Ireland" and "Cork Ireland")
  const tokens1 = clean1.split(' ').filter(t => t.length > 2 && t !== 'county');
  const tokens2 = clean2.split(' ').filter(t => t.length > 2 && t !== 'county');

  if (tokens1.length === 0 || tokens2.length === 0) return stringSim;

  let matchedTokens = 0;
  for (const t1 of tokens1) {
    if (tokens2.some(t2 => t1 === t2 || levenshteinSimilarity(t1, t2) >= 0.85)) {
      matchedTokens++;
    }
  }

  const tokenRatio = (2 * matchedTokens) / (tokens1.length + tokens2.length);
  return Math.min(1.0, Math.max(stringSim, tokenRatio));
}

/**
 * Year proximity scoring with +/- 3 years tolerance window
 */
export function yearProximityScore(year1?: number | null, year2?: number | null, maxDelta: number = 3): { score: number; delta: number | null } {
  if (year1 == null || year2 == null) {
    return { score: 0.7, delta: null }; // neutral default
  }

  const delta = Math.abs(year1 - year2);
  if (delta === 0) return { score: 1.0, delta: 0 };
  if (delta <= 1) return { score: 0.95, delta };
  if (delta <= 2) return { score: 0.90, delta };
  if (delta <= 3) return { score: 0.85, delta };
  if (delta <= 5) return { score: 0.60, delta };
  if (delta <= 10) return { score: 0.30, delta };

  return { score: 0.0, delta };
}

/**
 * Full composite matching evaluator
 */
export function computeCompositeMatch(
  anc1: { firstName: string; lastName: string; birthYear?: number | null; birthPlace?: string | null },
  anc2: { firstName: string; lastName: string; birthYear?: number | null; birthPlace?: string | null }
): MatchReasonMetrics {
  // 1. Surname similarity
  const lastJw = jaroWinklerSimilarity(anc1.lastName, anc2.lastName);
  const firstJw = jaroWinklerSimilarity(anc1.firstName, anc2.firstName);
  const fullNameJw = jaroWinklerSimilarity(
    `${anc1.firstName} ${anc1.lastName}`,
    `${anc2.firstName} ${anc2.lastName}`
  );

  const nameSimilarity = Math.max(fullNameJw, (lastJw * 0.65 + firstJw * 0.35));

  // 2. Phonetic matching
  const soundex1 = soundex(anc1.lastName);
  const soundex2 = soundex(anc2.lastName);
  const soundexMatch = soundex1 === soundex2;

  const metaphone1 = metaphone(anc1.lastName);
  const metaphone2 = metaphone(anc2.lastName);
  const metaphoneMatch = metaphone1 === metaphone2 || levenshteinSimilarity(metaphone1, metaphone2) >= 0.8;

  const phoneticMatch = soundexMatch || metaphoneMatch;

  // 3. Birthplace match
  const birthPlaceMatch = birthplaceSimilarity(anc1.birthPlace, anc2.birthPlace);

  // 4. Year proximity
  const yearResult = yearProximityScore(anc1.birthYear, anc2.birthYear, 3);

  // Composite Weighted Score:
  // - Name Jaro-Winkler: 45%
  // - Phonetics: 20%
  // - Birthplace: 20%
  // - Year Proximity: 15%
  const phoneticScore = (soundexMatch ? 0.5 : 0) + (metaphoneMatch ? 0.5 : 0);
  
  const compositeRatio =
    nameSimilarity * 0.45 +
    phoneticScore * 0.20 +
    birthPlaceMatch * 0.20 +
    yearResult.score * 0.15;

  const overallScore = Math.min(100, Math.round(compositeRatio * 1000) / 10);

  return {
    nameSimilarity: Math.round(nameSimilarity * 100) / 100,
    phoneticMatch,
    soundexMatch,
    metaphoneMatch,
    soundex1,
    soundex2,
    metaphone1,
    metaphone2,
    birthPlaceMatch: Math.round(birthPlaceMatch * 100) / 100,
    yearDelta: yearResult.delta,
    yearScore: Math.round(yearResult.score * 100) / 100,
    overallScore
  };
}

