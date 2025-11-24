import { CheckHedy } from './grammar/checks.js'
import langHandler from './lang/lang.js'

export function main() {
  // Detect Hedy level
  let level = 1
  const url = window.location.href
  const match = url.match(/\/hedy\/(\d+)/)
  if (match) {
    level = parseInt(match[1])
  }

  // Initialize CheckHedy
  let hedy
  try {
    hedy = new CheckHedy(level)
    langHandler.setLang('ca')
    console.log('Hedy Error Highlighter: CheckHedy initialized')
  } catch (e) {
    console.error('Hedy Error Highlighter: Error initializing CheckHedy:', e)
    return
  }

  // Load user configuration (long hover syntax disabled by default)
  function sendConfig(cfg) {
    window.postMessage({ type: 'HEDY_CONFIG', config: cfg }, '*')
  }
  const defaultConfig = { longHoverSyntaxEnabled: false }
  try {
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(defaultConfig, data => {
        sendConfig({ longHoverSyntaxEnabled: !!data.longHoverSyntaxEnabled })
      })
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' && changes.longHoverSyntaxEnabled) {
          sendConfig({ longHoverSyntaxEnabled: !!changes.longHoverSyntaxEnabled.newValue })
        }
      })
    } else {
      sendConfig(defaultConfig)
    }
  } catch (e) {
    console.warn('Hedy Error Highlighter: Unable to access chrome.storage', e)
    sendConfig(defaultConfig)
  }

  // Listen for messages from Bridge (Main World)
  window.addEventListener('message', event => {
    // We only accept messages from ourselves (window)
    if (event.source !== window || !event.data.type) return

    if (event.data.type === 'HEDY_CODE_UPDATE') {
      // Update level if provided
      if (event.data.level && event.data.level !== level) {
        level = event.data.level
        console.log('Hedy Error Highlighter: Level updated:', level)
        try {
          hedy = new CheckHedy(level)
        } catch (e) {
          console.error('Hedy Error Highlighter: Error re-initializing CheckHedy with new level:', e)
        }
      }
      analyzeCode(event.data.code)
    }
  })

  let lastAnalyzedText = ''

  const analyzeCode = text => {
    if (!text) return
    if (text === lastAnalyzedText) return
    lastAnalyzedText = text

    // Re-init hedy to clear memory/state
    try {
      hedy = new CheckHedy(level)
    } catch (e) {
      console.error('Hedy Error Highlighter: Error re-initializing CheckHedy:', e)
      return
    }

    const lines = text.split('\n')
    console.log('Hedy Error Highlighter: Analyzing code...', lines)
    let allErrors = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineCode = line.split('#')[0]

      try {
        const errors = hedy.analyse(lineCode, i)
        if (errors && errors.length > 0) {
          console.log(`Hedy Error Highlighter: Found ${errors.length} errors on line ${i}:`, errors)
          // Map errors to plain objects to ensure they can be cloned by postMessage
          const plainErrors = errors.map(e => ({
            message: e.message || e.getMessage(), // Ensure message is extracted
            start: e.start,
            end: e.end,
            line: i,
            errorCode: e.errorCode,
            severity: e.severity, // pass severity for coloring
          }))
          allErrors = allErrors.concat(plainErrors)
        }
      } catch (e) {
        console.error(`Hedy Error Highlighter: Error analyzing line ${i + 1}:`, e)
      }
    }

    try {
      const finalErrors = hedy.finalCheck()
      if (finalErrors && finalErrors.length > 0) {
        const plainFinalErrors = finalErrors.map(e => ({
          message: e.message || e.getMessage(),
          start: e.start,
          end: e.end,
          line: lines.length - 1, // Attach to last line?
          errorCode: e.errorCode,
          severity: e.severity,
        }))
        allErrors = allErrors.concat(plainFinalErrors)
      }
    } catch (e) {}

    // Build phrase (syntactic) data for long-hover schemas
    const phrases = []
    try {
      if (hedy && hedy.memory && Array.isArray(hedy.memory.past)) {
        for (const sint of hedy.memory.past) {
          // Traverse words recursively
          const stack = [...sint.words]
          while (stack.length) {
            const w = stack.pop()
            const wStart = w.pos
            const wEnd = w.end !== undefined ? w.end : w.pos + w.text.length
            // Include phrase-like tokens (those with subphrase or composite tags)
            if (w.subphrase) {
              phrases.push({ line: sint.linenum, start: wStart, end: wEnd, tag: w.tag || 'subphrase' })
              // Push inner subphrase words
              if (w.subphrase && w.subphrase.words) stack.push(...w.subphrase.words)
            } else if (w.tag) {
              phrases.push({ line: sint.linenum, start: wStart, end: wEnd, tag: w.tag })
            }
          }
        }
      }
    } catch (e) {
      console.warn('Hedy Error Highlighter: Failed to build phrases', e)
    }

    // Send errors back to bridge for highlighting
    window.postMessage({ type: 'HEDY_HIGHLIGHT_ERRORS', errors: allErrors }, '*')
    // Send syntactic phrases for long-hover visualization
    window.postMessage({ type: 'HEDY_PHRASES', phrases: phrases }, '*')
  }
}
