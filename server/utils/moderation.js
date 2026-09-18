const BANNED_WORDS = [
  'убийство', 'убить', 'убийца', 'зарезать', 'застрелить', 'казнить',
  'изнасиловать', 'насилие', 'пытка', 'похищение', 'теракт',
  'взрыв', 'бомба', 'оружие', 'наркотики',
  'нацизм', 'фашизм', 'экстремизм', 'терроризм',
  'мошенничество', 'скам', 'scam',
  'порно', 'секс', 'интим',
  'руфинг', 'зацепинг'
];

const SUSPICIOUS_PATTERNS = [
  /у\s*б\s*и\s*й\s*с\s*т\s*в/i,
  /у6ийство/i,
  /[a-z]*k[i1]ll[a-z]*/i
];

const DANGEROUS_ADDRESS_PATTERNS = [
  /у\s*подъезда/i,
  /у\s*дома\s*№?\s*\d+/i,
  /во\s*дворе\s*дома/i,
  /возле\s*квартиры/i
];

export function moderateContent(text) {
  if (!text || typeof text !== 'string') {
    return { isClean: false, reason: 'Пустой текст' };
  }
  const lower = text.toLowerCase();

  for (const w of BANNED_WORDS) {
    if (lower.includes(w)) {
      return { isClean: false, reason: `Запрещенное слово: "${w}"` };
    }
  }

  for (const p of SUSPICIOUS_PATTERNS) {
    if (p.test(text)) return { isClean: false, reason: 'Подозрительный контент' };
  }

  const upperRatio = (text.match(/[A-ZА-Я]/g) || []).length / text.length;
  if (text.length > 15 && upperRatio > 0.7) {
    return { isClean: false, reason: 'Слишком много заглавных букв' };
  }

  if (/(.)\1{5,}/.test(text)) {
    return { isClean: false, reason: 'Спам' };
  }

  return { isClean: true };
}

export function validateAddress(address) {
  for (const p of DANGEROUS_ADDRESS_PATTERNS) {
    if (p.test(address)) {
      return {
        isClean: false,
        reason: 'Указывайте только общественные места'
      };
    }
  }
  return { isClean: true };
}