
/**
 * Removes Hebrew niqqud (vowel points) and other cantillation marks.
 * Hebrew vowel points are in the Unicode range U+0591 to U+05C7.
 */
export const stripNiqqud = (text: string): string => {
  return text.replace(/[\u0591-\u05C7]/g, '');
};
