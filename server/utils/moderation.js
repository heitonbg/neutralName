// server/utils/moderation.js
// Единый источник правил модерации. Реэкспорт из общего модуля.
import {
  moderateContent,
  validateAddress,
  moderateUrl,
  BANNED_WORDS,
  SUSPICIOUS_PATTERNS,
  DANGEROUS_ADDRESS_PATTERNS,
} from '../../src/utils/moderationShared.js';

export {
  moderateContent,
  validateAddress,
  moderateUrl,
  BANNED_WORDS,
  SUSPICIOUS_PATTERNS,
  DANGEROUS_ADDRESS_PATTERNS,
};