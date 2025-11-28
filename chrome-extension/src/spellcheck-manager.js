import { checkSpelling } from './spellcheck.js'

/**
 * Spelling via Misspelling Dictionary
 * - Only orthographic errors (words) are tracked.
 * - Maintain a dictionary: misspelled word -> suggestions.
 * - Always emit known errors immediately from the dictionary.
 * - Minimize API calls: at first run or at most every 5s after the last call.
 */
export class SpellCheckManager {
  constructor(postFn = window.postMessage.bind(window)) {
    this.post = postFn
    this.enabled = true
    this.language = 'ca'
    this.lastApiTime = 0
    this.pendingTimeout = null
    this.WAIT_INTERVAL = 5000
    this.firstRunDone = false
    // Dictionary: lowerWord -> { message, shortMessage, suggestions: Array<string>, rule: { id, category: { id } } }
    this.dict = new Map()
    this.currentTokens = []
  }

  updateConfig({ enabled, language }) {
    if (enabled !== undefined) this.enabled = !!enabled
    if (language) this.language = language
  }

  // Iterate words within a token text with their local indices
  _iterWords(text) {
    const words = []
    // Supports Latin letters with diacritics + apostrophes common in Catalan
    const re = /[A-Za-zÀ-ÖØ-öø-ÿ’']+/g
    let m
    while ((m = re.exec(text)) !== null) {
      words.push({ word: m[0], index: m.index })
    }
    return words
  }

  _makeError(token, localIndex, word, entry) {
    const start = token.start + localIndex
    const end = start + word.length
    return {
      line: token.line,
      start,
      end,
      shortMessage: entry?.shortMessage || 'Typo',
      message: entry?.message || 'Possible typo',
      replacements: (entry?.suggestions || []).map(s => ({ value: s })),
      rule: entry?.rule || { id: 'LOCAL_TYPO', category: { id: 'TYPOS' } },
    }
  }

  // Build errors from the local dictionary for the provided tokens
  _errorsFromDict(tokens) {
    const out = []
    for (const t of tokens) {
      if (!t || typeof t.text !== 'string') continue
      const words = this._iterWords(t.text)
      for (const { word, index } of words) {
        const key = word.toLowerCase()
        const entry = this.dict.get(key)
        if (entry) {
          out.push(this._makeError(t, index, word, entry))
        }
      }
    }
    return out
  }

  processQuotedStrings(tokens) {
    if (!this.enabled) return []
    this.currentTokens = tokens

    // Emit known errors immediately
    const immediate = this._errorsFromDict(tokens)
    try {
      console.log(
        '[SpellMgr] emit known errors',
        immediate.map(e => ({ line: e.line, start: e.start, end: e.end })),
      )
    } catch (_) {}
    this.post({ type: 'HEDY_SPELL_ERRORS', errors: immediate }, '*')

    // Schedule minimal API refreshes
    const now = Date.now()
    const elapsed = now - this.lastApiTime
    const shouldCallNow = !this.firstRunDone || elapsed >= this.WAIT_INTERVAL
    const scheduleLater = !shouldCallNow

    const trigger = () => {
      console.log('[SpellMgr] triggering API check')
      this._runApiCheck(this.currentTokens)
    }
    if (shouldCallNow) {
      if (this.pendingTimeout) {
        clearTimeout(this.pendingTimeout)
        this.pendingTimeout = null
      }
      trigger()
    } else if (!this.pendingTimeout) {
      const wait = this.WAIT_INTERVAL - elapsed
      this.pendingTimeout = setTimeout(() => {
        this.pendingTimeout = null
        trigger()
      }, wait)
    }

    this.firstRunDone = true
    return immediate
  }

  async _runApiCheck(tokens) {
    if (!this.enabled) return
    this.lastApiTime = Date.now()
    try {
      console.log('[SpellMgr] API call start', { count: tokens.length, language: this.language })
    } catch (_) {}
    try {
      const errors = await checkSpelling(tokens, this.language)
      try {
        console.log(
          '[SpellMgr] API response errors',
          errors.map(e => ({ line: e.line, start: e.start, end: e.end })),
        )
      } catch (_) {}
      // Update dictionary with new misspellings
      for (const err of errors) {
        const owner = tokens.find(t => t.line === err.line && t.start <= err.start && t.end >= err.end)
        if (!owner) continue
        const localStart = err.start - owner.start
        const localEnd = err.end - owner.start
        const word = owner.text.substring(localStart, localEnd)
        if (!word) continue
        const key = word.toLowerCase()
        let suggestions = []
        if (Array.isArray(err.suggestions)) {
          suggestions = err.suggestions.map(s => (typeof s === 'string' ? s : s && s.value)).filter(Boolean)
        } else if (Array.isArray(err.replacements)) {
          suggestions = err.replacements.map(r => (typeof r === 'string' ? r : r && r.value)).filter(Boolean)
        }
        // Store/override latest info to mirror LT outputs
        this.dict.set(key, {
          message: err.message,
          shortMessage: err.shortMessage,
          suggestions,
          rule:
            err.rule && err.rule.id
              ? { id: err.rule.id, category: { id: (err.rule.category && err.rule.category.id) || 'TYPOS' } }
              : { id: 'TYPOS', category: { id: 'TYPOS' } },
        })
      }
      // Emit server-provided errors after dictionary update
      this.post({ type: 'HEDY_SPELL_ERRORS', errors }, '*')
      try {
        console.log('[SpellMgr] emit server errors', errors.length)
      } catch (_) {}
    } catch (e) {
      console.error('SpellCheckManager: API error', e)
      // Fall back to known errors
      const fallback = this._errorsFromDict(this.currentTokens)
      this.post({ type: 'HEDY_SPELL_ERRORS', errors: fallback }, '*')
      try {
        console.log('[SpellMgr] emit fallback errors', fallback.length)
      } catch (_) {}
    }
  }
}
