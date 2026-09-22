// server/utils/moderation.js
// Реэкспорт правил модерации из локальной копии внутри server/.
// ⚠️ Файл moderationShared.js синхронизируется со src/utils/moderationShared.js
// через scripts/sync-moderation.mjs (см. корневой package.json → predev/prebuild).
import {
  moderateContent,
  validateAddress,
  moderateUrl,
  BANNED_WORDS,
  SUSPICIOUS_PATTERNS,
  DANGEROUS_ADDRESS_PATTERNS,
} from './moderationShared.js';

export {
  moderateContent,
  validateAddress,
  moderateUrl,
  BANNED_WORDS,
  SUSPICIOUS_PATTERNS,
  DANGEROUS_ADDRESS_PATTERNS,
};