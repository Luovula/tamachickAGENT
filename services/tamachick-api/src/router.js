import { sanitizeAnimationTag } from './contracts.js';

const KEYWORD_RULES = [
  { tag: 'celebrate', pattern: /(celebrate|won|shipped|finished|done|success|yay|proud)/i },
  { tag: 'sleepy', pattern: /(sleepy|tired|exhausted|burned out|drained|nap)/i },
  { tag: 'concerned', pattern: /(anxious|worried|stressed|panic|overwhelmed|scared|blocked)/i },
  { tag: 'encourage', pattern: /(cheer me up|encourage|motivate|pep talk|support|help me start)/i },
  { tag: 'thinking', pattern: /(think|plan|brainstorm|idea|what should|unsure|confused|help)/i },
  { tag: 'explain', pattern: /(explain|how does|what is|why is|teach me|clarify)/i },
  { tag: 'wave', pattern: /^(hi|hello|hey|yo|sup|good morning|good evening)\b/i },
  { tag: 'happy', pattern: /(happy|great|excited|awesome|love this|fun)/i },
  { tag: 'idle', pattern: /(idle|waiting|standing by|just checking in)/i },
];

export function classifyAnimationTag(message) {
  const normalized = typeof message === 'string' ? message.trim() : '';

  if (!normalized) {
    return 'fallback';
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(normalized)) {
      return sanitizeAnimationTag(rule.tag);
    }
  }

  return 'fallback';
}
