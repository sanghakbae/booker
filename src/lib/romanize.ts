/**
 * Hangul → Latin, following the Revised Romanization of Korean.
 *
 * A Korean address works, but percent-encoding makes it unreadable the moment
 * it is pasted into Slack or an email:
 *   /s/카피킬러hr-사용-매뉴얼 → /s/%EC%B9%B4%ED%94%84...
 *
 * Syllable-boundary assimilation rules are not applied — those need whole-word
 * context and only change a few consonants. The point here is a readable,
 * stable address, not a pronunciation guide.
 */

const BASE = 0xac00;
const LAST = 0xd7a3;

// 19 initials, 21 medials, 28 finals, in Unicode order.
const INITIALS = [
  "g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s",
  "ss", "", "j", "jj", "ch", "k", "t", "p", "h",
];

const MEDIALS = [
  "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa",
  "wae", "oe", "yo", "u", "we", "wi", "wo", "yu", "eu", "ui",
  "i",
];

const FINALS = [
  "", "k", "k", "kt", "n", "nj", "nh", "t", "l", "lk",
  "lm", "lp", "ls", "lt", "lp", "lh", "m", "p", "ps", "t",
  "t", "ng", "t", "t", "k", "t", "p", "t",
];

/** Standalone jamo, for input that is not composed into syllables. */
const JAMO: Record<string, string> = {
  "ㄱ": "g", "ㄲ": "kk", "ㄴ": "n", "ㄷ": "d", "ㄸ": "tt",
  "ㄹ": "r", "ㅁ": "m", "ㅂ": "b", "ㅃ": "pp", "ㅅ": "s",
  "ㅆ": "ss", "ㅇ": "", "ㅈ": "j", "ㅉ": "jj", "ㅊ": "ch",
  "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "h",
  "ㅏ": "a", "ㅐ": "ae", "ㅑ": "ya", "ㅒ": "yae", "ㅓ": "eo",
  "ㅔ": "e", "ㅕ": "yeo", "ㅖ": "ye", "ㅗ": "o", "ㅘ": "wa",
  "ㅙ": "wae", "ㅚ": "oe", "ㅛ": "yo", "ㅜ": "u", "ㅝ": "wo",
  "ㅞ": "we", "ㅟ": "wi", "ㅠ": "yu", "ㅡ": "eu", "ㅢ": "ui",
  "ㅣ": "i",
};

/** Transliterates Hangul and leaves everything else untouched. */
export function romanize(input: string): string {
  let out = "";
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;

    if (code >= BASE && code <= LAST) {
      const offset = code - BASE;
      out += INITIALS[Math.floor(offset / 588)];
      out += MEDIALS[Math.floor((offset % 588) / 28)];
      out += FINALS[offset % 28];
      continue;
    }

    out += JAMO[char] ?? char;
  }
  return out;
}

/** True when the text contains Hangul that an address would percent-encode. */
export function hasHangul(input: string) {
  return /[가-힣ㄱ-ㆎ]/.test(input);
}
