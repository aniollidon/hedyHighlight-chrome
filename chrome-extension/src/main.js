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

    // Send errors back to bridge for highlighting
    window.postMessage({ type: 'HEDY_HIGHLIGHT_ERRORS', errors: allErrors }, '*')
  }
}
