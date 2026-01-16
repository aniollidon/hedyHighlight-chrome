const LANGUAGETOOL_API = 'https://api.languagetoolplus.com/v2/check'
const CACHE = new Map()

// Diccionari personalitzat per a paraules que acceptem
const CUSTOM_DICTIONARY = new Set([
  'hedy',
  'python',
  // Afegeix més paraules aquí segons necessiti
])

/**
 * Extract all constant_string_quoted tokens from hedy analysis
 * Returns array of { text, line, start, end }
 */
export function extractQuotedStrings(words, line) {
  const strings = []
  if (!Array.isArray(words)) return strings

  function traverse(wordList) {
    for (const w of wordList) {
      if (w.tag && w.tag.startsWith('constant_string_quoted')) {
        strings.push({
          text: w.text, // e.g. "hello"
          line: line,
          start: w.pos,
          end: w.end !== undefined ? w.end : w.pos + w.text.length,
        })
      }
      if (w.subphrase && w.subphrase.words) {
        traverse(w.subphrase.words)
      }
    }
  }

  traverse(words)
  return strings
}

/**
 * Extract all unquoted_string tokens from hedy analysis
 * Returns array of { text, line, start, end }
 */
export function extractUnquotedStrings(words, line) {
  const strings = []
  if (!Array.isArray(words)) return strings

  function traverse(wordList) {
    for (const w of wordList) {
      if (w.tag && w.tag.startsWith('constant_string_unquoted')) {
        strings.push({
          text: w.text,
          line: line,
          start: w.pos,
          end: w.end !== undefined ? w.end : w.pos + w.text.length,
        })
      }
      if (w.subphrase && w.subphrase.words) {
        traverse(w.subphrase.words)
      }
    }
  }

  traverse(words)
  return strings
}

/**
 * Clean quoted text (remove quotes) for spell checking
 */
function cleanQuotedText(text) {
  return text.replace(/^["']|["']$/g, '')
}

/**
 * Request spell check from LanguageTool
 * texts: array of objects { text, line, start, end }
 * language: 'ca' or 'en'
 */
export async function checkSpelling(texts, language = 'ca') {
  if (!texts || texts.length === 0) return []

  // Group by line for better tracking
  const textsByLine = {}
  texts.forEach(t => {
    if (!textsByLine[t.line]) textsByLine[t.line] = []
    textsByLine[t.line].push(t)
  })

  const langCode = language === 'ca' ? 'ca' : 'en-US'

  try {
    // Send all texts in one request, separated by newlines for identification
    const cleanedTexts = texts.map(t => cleanQuotedText(t.text))
    // Include line/start positions in cache key to avoid stale line mappings
    const positionsKey = texts.map(t => `${t.line}@${t.start}`).join('|')
    const cacheKey = cleanedTexts.join('\n') + '::' + langCode + '::' + positionsKey
    if (CACHE.has(cacheKey)) {
      //console.log('SpellCheck cache hit for key:', cacheKey)
      return CACHE.get(cacheKey)
    }

    const data = new URLSearchParams()
    data.append('text', cleanedTexts.join('\n'))
    data.append('language', langCode)
    data.append('enabledOnly', 'false')

    //console.log('Sending spell check request to LanguageTool API with data:', data.toString())
    const response = await fetch(LANGUAGETOOL_API, {
      method: 'POST',
      body: data,
    })

    if (!response.ok) {
      console.error(`LanguageTool API error: HTTP ${response.status} ${response.statusText}`)
      return []
    }

    const result = await response.json()

    // Log if API returns errors
    if (result.software && result.software.errors && result.software.errors.length > 0) {
      console.warn('LanguageTool API returned errors:', result.software.errors)
    }

    const matches = result.matches || []

    // Build a map of character positions to original texts
    let charPosition = 0
    const positionMap = [] // array of { charStart, charEnd, textIndex }

    cleanedTexts.forEach((text, idx) => {
      positionMap.push({
        charStart: charPosition,
        charEnd: charPosition + text.length,
        textIndex: idx,
      })
      charPosition += text.length + 1 // +1 for newline
    })

    // Map errors back to original texts
    const errors = []
    matches.forEach(match => {
      //Agafa només errors ortogràfics
      if (match.rule && match.rule.category && match.rule.category.id !== 'TYPOS') {
        return
      }

      // Ignore words in custom dictionary (case-insensitive)
      // Extract word from combined text using offset and length
      const matchStartPos = match.offset
      const matchEndPos = match.offset + match.length
      const combinedText = cleanedTexts.join('\n')
      const errorWord = combinedText.substring(matchStartPos, matchEndPos).toLowerCase()

      if (CUSTOM_DICTIONARY.has(errorWord)) {
        return
      }

      // Find which text this error belongs to
      const matchPos = match.offset
      const textMapping = positionMap.find(m => matchPos >= m.charStart && matchPos < m.charEnd)

      if (textMapping && texts[textMapping.textIndex]) {
        const originalText = texts[textMapping.textIndex]
        // Account for opening quote only if the token is quoted
        const firstChar = (originalText.text || '').charAt(0)
        const offset = firstChar === '"' || firstChar === "'" ? 1 : 0
        const relativeOffset = match.offset - textMapping.charStart

        errors.push({
          line: originalText.line,
          start: originalText.start + offset + relativeOffset,
          end: originalText.start + offset + relativeOffset + match.length,
          message: match.message,
          suggestions: (match.replacements || []).slice(0, 3).map(r => r.value),
        })
      }
    })

    CACHE.set(cacheKey, errors)
    return errors
  } catch (e) {
    console.error('LanguageTool spell check error:', e)
    return []
  }
}

export function clearCache() {
  CACHE.clear()
}
