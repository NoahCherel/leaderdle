const PARTICLES = new Set(['de', 'da', 'di', 'del', 'della', 'der', 'den', 'van', 'von', 'la', 'le', 'du', 'bin', 'ibn', 'al', 'el']);
const ROMAN = /^[IVXLC]+$/;

/** The "Reveal initials" hint: one letter per word, particles and regnal numbers kept whole. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (ROMAN.test(word) || PARTICLES.has(word)) return word;
      return word.charAt(0).toUpperCase() + '.';
    })
    .join(' ');
}
