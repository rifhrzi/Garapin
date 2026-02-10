import { FlagType } from '@prisma/client';

interface FilterResult {
  isBlocked: boolean;
  flags: Array<{ type: FlagType; pattern: string }>;
  sanitizedContent: string;
}

// Indonesian phone number patterns
const PHONE_PATTERNS = [
  /(\+62|62|0)[\s\-.]?8\d{1,2}[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/gi,
  /(\+62|62|0)[\s\-.]?\d{2,3}[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/gi,
  /zero\s*eight/gi,
  /nol\s*delapan/gi,
];

const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi;

const URL_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,
  /[a-zA-Z0-9\-]+\.(com|net|org|io|co\.id|id|me|xyz|dev)[^\s]*/gi,
];

const SOCIAL_HANDLE_PATTERN = /@[a-zA-Z0-9_]{3,}/gi;

// Indonesian + English keywords for off-platform contact
const KEYWORD_BLACKLIST = [
  'whatsapp', 'whats app', 'wa ', 'w.a', 'w a ',
  'line ', 'line@', 'lineid',
  'telegram', 'tele ', 'tele@',
  'instagram', 'ig ', 'ig:', 'ignya',
  'facebook', 'fb ',
  'twitter', 'x.com',
  'discord',
  'dm ', 'dm me', 'dm aja',
  'hubungi', 'kontak', 'contact me',
  'langsung', 'di luar', 'diluar',
  'outside', 'off platform', 'off-platform',
  'nomor', 'nomer', 'no hp', 'no. hp', 'nohp',
  'chat di', 'chat lewat', 'lewat wa',
];

// Long number sequences (potential phone numbers)
const NUMBER_SEQUENCE_PATTERN = /\d[\d\s\-.]{7,}\d/g;

export class ChatFilterService {
  /**
   * Filters a message for contact information bypass attempts.
   * Pre-escrow: blocks the message entirely.
   * Post-escrow: allows but flags for admin audit.
   */
  filter(content: string, escrowActive: boolean): FilterResult {
    const flags: Array<{ type: FlagType; pattern: string }> = [];
    let sanitizedContent = content;

    // 1. Phone number detection
    for (const pattern of PHONE_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((m) => flags.push({ type: 'PHONE', pattern: m }));
        sanitizedContent = sanitizedContent.replace(pattern, '[FILTERED]');
      }
    }

    // 2. Email detection
    const emailMatches = content.match(EMAIL_PATTERN);
    if (emailMatches) {
      emailMatches.forEach((m) => flags.push({ type: 'EMAIL', pattern: m }));
      sanitizedContent = sanitizedContent.replace(EMAIL_PATTERN, '[FILTERED]');
    }

    // 3. URL detection
    for (const pattern of URL_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((m) => flags.push({ type: 'URL', pattern: m }));
        if (!escrowActive) {
          sanitizedContent = sanitizedContent.replace(pattern, '[FILTERED]');
        }
      }
    }

    // 4. Social media handles
    const handleMatches = content.match(SOCIAL_HANDLE_PATTERN);
    if (handleMatches) {
      handleMatches.forEach((m) => flags.push({ type: 'SOCIAL_MEDIA', pattern: m }));
      sanitizedContent = sanitizedContent.replace(SOCIAL_HANDLE_PATTERN, '[FILTERED]');
    }

    // 5. Keyword blacklist
    const lowerContent = content.toLowerCase();
    for (const keyword of KEYWORD_BLACKLIST) {
      if (lowerContent.includes(keyword.trim())) {
        flags.push({ type: 'KEYWORD', pattern: keyword.trim() });
      }
    }

    // 6. Long number sequences
    const numberMatches = content.match(NUMBER_SEQUENCE_PATTERN);
    if (numberMatches) {
      numberMatches.forEach((m) => {
        const digits = m.replace(/\D/g, '');
        if (digits.length >= 8) {
          flags.push({ type: 'PHONE', pattern: m });
          sanitizedContent = sanitizedContent.replace(m, '[FILTERED]');
        }
      });
    }

    // Pre-escrow: any flag means block
    const isBlocked = !escrowActive && flags.length > 0;

    return {
      isBlocked,
      flags,
      sanitizedContent: isBlocked ? '' : sanitizedContent,
    };
  }
}

export const chatFilterService = new ChatFilterService();
