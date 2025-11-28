function checkAndSendCode() {
  let code = ''
  let level = 1
  let source = 'none'

  if (window.hedyApp) {
    if (window.hedyApp.theLevel) {
      level = parseInt(window.hedyApp.theLevel)
    }
    if (typeof window.hedyApp.getEditorContents === 'function') {
      code = window.hedyApp.getEditorContents()
      source = 'hedyApp.getEditorContents'
    } else if (typeof window.hedyApp.get_active_and_trimmed_code === 'function') {
      code = window.hedyApp.get_active_and_trimmed_code()
      source = 'hedyApp.get_active_and_trimmed_code'
    }
  }

  if (!code) {
    const editorContainer = document.getElementById('editor')
    if (editorContainer) {
      const cmContent = editorContainer.querySelector('.cm-content')
      if (cmContent) {
        code = cmContent.innerText
        source = 'DOM #editor .cm-content'
      }
    }
  }

  if (code) {
    window.postMessage({ type: 'HEDY_CODE_UPDATE', code: code, level: level }, '*')
  }
}

setInterval(checkAndSendCode, 1000)
document.addEventListener('keyup', () => {
  setTimeout(checkAndSendCode, 100)
})

let currentErrors = []
let currentSpellingErrors = []
let highlightRects = []
let spellingHighlightRects = []
let isUpdating = false
let currentPhrases = []
let lastFullCode = ''
let longHoverTimer = null
let longHoverTarget = null
const LONG_HOVER_MS = 500
let lastMouseX = 0
let lastMouseY = 0
let lastHoverOverError = false
let longHoverEnabled = false
let spellCheckEnabled = true
let currentSpellingError = null // Track current spelling error for interactivity
let spellingHoverCorridor = null // Expanded hover zone to ease moving into tooltip

window.addEventListener('message', event => {
  if (event.source !== window || !event.data.type) return
  if (event.data.type === 'HEDY_HIGHLIGHT_ERRORS') {
    currentErrors = event.data.errors
    requestUpdate()
  }
  if (event.data.type === 'HEDY_PHRASES') {
    currentPhrases = event.data.phrases || []
  }
  if (event.data.type === 'HEDY_CONFIG') {
    if (event.data.config) {
      longHoverEnabled = !!event.data.config.longHoverSyntaxEnabled
      spellCheckEnabled = !!event.data.config.spellCheckEnabled
    }
  }
  if (event.data.type === 'HEDY_SPELL_ERRORS') {
    currentSpellingErrors = event.data.errors || []
    requestUpdate()
  }
})

window.addEventListener('scroll', requestUpdate, {
  capture: true,
  passive: true,
})
window.addEventListener('resize', requestUpdate, { passive: true })

const tooltip = document.createElement('div')
tooltip.className = 'hedy-error-tooltip'
tooltip.style.position = 'fixed'
tooltip.style.background = '#1e1e1e'
tooltip.style.color = '#fafafa'
tooltip.style.padding = '6px 10px'
tooltip.style.borderRadius = '6px'
tooltip.style.fontSize = '12px'
tooltip.style.fontFamily = "Consolas, 'Cascadia Code', Menlo, Monaco, 'SFMono-Regular', monospace"
tooltip.style.letterSpacing = '0.2px'
tooltip.style.lineHeight = '1.3'
tooltip.style.border = '1px solid #444'
tooltip.style.backgroundImage = 'linear-gradient(135deg, #1e1e1e 0%, #242424 100%)'
tooltip.style.zIndex = '29'
tooltip.style.pointerEvents = 'none'
tooltip.style.display = 'none'
tooltip.style.maxWidth = '500px'
tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)'
tooltip.style.whiteSpace = 'pre-wrap'
tooltip.style.userSelect = 'none'
document.body.appendChild(tooltip)

const syntaxTooltip = document.createElement('div')
syntaxTooltip.className = 'hedy-syntax-tooltip'
syntaxTooltip.style.position = 'fixed'
syntaxTooltip.style.background = '#2a2a3a'
syntaxTooltip.style.color = '#e0e0ff'
syntaxTooltip.style.padding = '8px 12px'
syntaxTooltip.style.borderRadius = '6px'
syntaxTooltip.style.fontSize = '11px'
syntaxTooltip.style.fontFamily = "Consolas, 'Cascadia Code', Menlo, Monaco, 'SFMono-Regular', monospace"
syntaxTooltip.style.letterSpacing = '0.2px'
syntaxTooltip.style.lineHeight = '1.4'
syntaxTooltip.style.border = '1px solid #4a5a8a'
syntaxTooltip.style.backgroundImage = 'linear-gradient(135deg, #2a2a3a 0%, #353555 100%)'
syntaxTooltip.style.zIndex = '28'
syntaxTooltip.style.pointerEvents = 'none'
syntaxTooltip.style.display = 'none'
syntaxTooltip.style.maxWidth = '520px'
syntaxTooltip.style.boxShadow = '0 4px 12px rgba(100,100,200,0.3)'
syntaxTooltip.style.whiteSpace = 'pre-wrap'
syntaxTooltip.style.userSelect = 'none'
document.body.appendChild(syntaxTooltip)

const spellCheckTooltip = document.createElement('div')
spellCheckTooltip.className = 'hedy-spellcheck-tooltip'
spellCheckTooltip.style.position = 'fixed'
spellCheckTooltip.style.background = '#0f1f0f'
spellCheckTooltip.style.color = '#7aa87a'
spellCheckTooltip.style.padding = '6px 10px'
spellCheckTooltip.style.borderRadius = '6px'
spellCheckTooltip.style.fontSize = '12px'
spellCheckTooltip.style.fontFamily = "Consolas, 'Cascadia Code', Menlo, Monaco, 'SFMono-Regular', monospace"
spellCheckTooltip.style.letterSpacing = '0.2px'
spellCheckTooltip.style.lineHeight = '1.3'
spellCheckTooltip.style.border = '1px solid #3a5a3a'
spellCheckTooltip.style.backgroundImage = 'linear-gradient(135deg, #0f1f0f 0%, #1a3a1a 100%)'
spellCheckTooltip.style.zIndex = '27'
spellCheckTooltip.style.pointerEvents = 'auto'
spellCheckTooltip.style.display = 'none'
spellCheckTooltip.style.maxWidth = '480px'
spellCheckTooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)'
spellCheckTooltip.style.whiteSpace = 'pre-wrap'
spellCheckTooltip.style.userSelect = 'none'
document.body.appendChild(spellCheckTooltip)

window.addEventListener(
  'mousemove',
  e => {
    let hovered = false
    // If tooltip is visible, keep it visible when inside expanded corridor
    if (spellCheckTooltip.style.display === 'block' && spellingHoverCorridor) {
      if (
        e.clientX >= spellingHoverCorridor.left &&
        e.clientX <= spellingHoverCorridor.right &&
        e.clientY >= spellingHoverCorridor.top &&
        e.clientY <= spellingHoverCorridor.bottom
      ) {
        hovered = true
      }
    }
    for (const item of highlightRects) {
      if (
        e.clientX >= item.rect.left &&
        e.clientX <= item.rect.right &&
        e.clientY >= item.rect.top &&
        e.clientY <= item.rect.bottom
      ) {
        tooltip.innerHTML = item.errorCode
          ? `${item.message} <span style="color:#888">(${item.errorCode})</span>`
          : item.message
        tooltip.style.display = 'block'
        tooltip.style.left = `${e.clientX + 10}px`
        tooltip.style.top = `${e.clientY + 10}px`
        hovered = true
        break
      }
    }
    if (!hovered) {
      // Check spelling errors
      for (const item of spellingHighlightRects) {
        if (
          e.clientX >= item.rect.left &&
          e.clientX <= item.rect.right &&
          e.clientY >= item.rect.top &&
          e.clientY <= item.rect.bottom
        ) {
          currentSpellingError = item
          const suggestionsHtml =
            item.suggestions && item.suggestions.length > 0
              ? `<br><span>Propostes:</span> ${item.suggestions
                  .map(
                    s =>
                      `<span data-suggestion="${s}" style="cursor:pointer; text-decoration:underline; color:#9aca9a">${s}</span>`,
                  )
                  .join(', ')}`
              : ''
          spellCheckTooltip.innerHTML = `${item.message}${suggestionsHtml}`
          spellCheckTooltip.style.display = 'block'
          spellCheckTooltip.style.left = `${item.rect.left + 2}px`
          spellCheckTooltip.style.top = `${item.rect.top - spellCheckTooltip.offsetHeight}px`
          try {
            const tipRect = spellCheckTooltip.getBoundingClientRect()
            const pad = 6
            spellingHoverCorridor = {
              left: Math.min(item.rect.left, tipRect.left) - pad,
              right: Math.max(item.rect.right, tipRect.right) + pad,
              top: Math.min(item.rect.top, tipRect.top) - pad,
              bottom: Math.max(item.rect.bottom, tipRect.bottom) + pad,
            }
          } catch (_) {
            spellingHoverCorridor = null
          }
          hovered = true
          break
        }
      }
    }
    if (!hovered) {
      tooltip.style.display = 'none'
      syntaxTooltip.style.display = 'none'
      spellCheckTooltip.style.display = 'none'
      spellingHoverCorridor = null
    }

    // Long-hover detection (syntactic schema)
    handleLongHover(e, hovered)
  },
  { passive: true },
)

window.addEventListener(
  'mousemove',
  e => {
    let hovered = false
    // Corridor support for second listener too
    if (spellCheckTooltip.style.display === 'block' && spellingHoverCorridor) {
      if (
        e.clientX >= spellingHoverCorridor.left &&
        e.clientX <= spellingHoverCorridor.right &&
        e.clientY >= spellingHoverCorridor.top &&
        e.clientY <= spellingHoverCorridor.bottom
      ) {
        hovered = true
      }
    }
    for (const item of highlightRects) {
      if (
        e.clientX >= item.rect.left &&
        e.clientX <= item.rect.right &&
        e.clientY >= item.rect.top &&
        e.clientY <= item.rect.bottom
      ) {
        tooltip.innerHTML = item.errorCode
          ? `${item.message} <span style="color:#888">(${item.errorCode})</span>`
          : item.message
        tooltip.style.display = 'block'
        if (!tooltip._arrow) {
          const arrow = document.createElement('div')
          arrow.style.position = 'absolute'
          arrow.style.width = '0'
          arrow.style.height = '0'
          arrow.style.borderLeft = '6px solid transparent'
          arrow.style.borderRight = '6px solid transparent'
          arrow.style.borderTop = '6px solid #1e1e1e'
          arrow.style.bottom = '-6px'
          arrow.style.left = '12px'
          tooltip.appendChild(arrow)
          tooltip._arrow = arrow
        }
        const anchorLeft = item.anchorLeft !== undefined ? item.anchorLeft : item.rect.left
        const anchorTop = item.anchorTop !== undefined ? item.anchorTop : item.rect.top
        tooltip.style.left = `${Math.round(anchorLeft) + 2}px`
        tooltip.style.top = '0px'
        const height = tooltip.offsetHeight
        let desiredTop = anchorTop - height
        let placeBelow = false
        if (desiredTop < 4) {
          desiredTop = anchorTop + item.rect.height
          placeBelow = true
        }
        tooltip.style.top = `${Math.round(desiredTop)}px`
        if (tooltip._arrow) {
          if (placeBelow) {
            tooltip._arrow.style.borderTop = 'none'
            tooltip._arrow.style.borderBottom = '6px solid #1e1e1e'
            tooltip._arrow.style.top = '-6px'
            tooltip._arrow.style.bottom = 'auto'
          } else {
            tooltip._arrow.style.borderBottom = 'none'
            tooltip._arrow.style.borderTop = '6px solid #1e1e1e'
            tooltip._arrow.style.bottom = '-6px'
            tooltip._arrow.style.top = 'auto'
          }
        }
        hovered = true
        break
      }
    }
    if (!hovered) {
      tooltip.style.display = 'none'
      syntaxTooltip.style.display = 'none'
      spellCheckTooltip.style.display = 'none'

      // Check spelling errors in second listener too
      for (const item of spellingHighlightRects) {
        if (
          e.clientX >= item.rect.left &&
          e.clientX <= item.rect.right &&
          e.clientY >= item.rect.top &&
          e.clientY <= item.rect.bottom
        ) {
          currentSpellingError = item
          const suggestionsHtml =
            item.suggestions && item.suggestions.length > 0
              ? `<br><span>Propostes:</span> ${item.suggestions
                  .map(
                    s =>
                      `<span data-suggestion="${s}" style="cursor:pointer; text-decoration:underline; color:#9aca9a">${s}</span>`,
                  )
                  .join(', ')}`
              : ''
          spellCheckTooltip.innerHTML = `${item.message}${suggestionsHtml}`
          spellCheckTooltip.style.display = 'block'
          spellCheckTooltip.style.left = `${item.rect.left + 2}px`
          spellCheckTooltip.style.top = `${item.rect.top - spellCheckTooltip.offsetHeight}px`
          try {
            const tipRect = spellCheckTooltip.getBoundingClientRect()
            const pad = 6
            spellingHoverCorridor = {
              left: Math.min(item.rect.left, tipRect.left) - pad,
              right: Math.max(item.rect.right, tipRect.right) + pad,
              top: Math.min(item.rect.top, tipRect.top) - pad,
              bottom: Math.max(item.rect.bottom, tipRect.bottom) + pad,
            }
          } catch (_) {
            spellingHoverCorridor = null
          }
          hovered = true
          break
        }
      }
    }
    if (!hovered) {
      tooltip.style.display = 'none'
      syntaxTooltip.style.display = 'none'
      spellCheckTooltip.style.display = 'none'
      spellingHoverCorridor = null
    }

    // Long-hover detection also here (second listener positioning arrow)
    handleLongHover(e, hovered)
  },
  { passive: true },
)

// Keep spell check tooltip visible when hovering over it
spellCheckTooltip.addEventListener('mousemove', e => {
  e.stopPropagation()
})

spellCheckTooltip.addEventListener('mouseleave', () => {
  spellCheckTooltip.style.display = 'none'
  currentSpellingError = null
})

// Handle clicks on suggestions in spell check tooltip
spellCheckTooltip.addEventListener('click', e => {
  const suggestionSpan = e.target.closest('[data-suggestion]')
  if (suggestionSpan && currentSpellingError) {
    const suggestion = suggestionSpan.getAttribute('data-suggestion')
    replaceSpellingError(currentSpellingError, suggestion)
  }
})

function handleLongHover(e, overError) {
  if (!longHoverEnabled) return
  lastMouseX = e.clientX
  lastMouseY = e.clientY
  lastHoverOverError = overError
  const editorContainer = document.getElementById('editor')
  if (!editorContainer) return
  const cmContent = editorContainer.querySelector('.cm-content')
  if (!cmContent) return

  // Determine line element under cursor
  const el = document.elementFromPoint(e.clientX, e.clientY)
  if (!el) return
  const lineEl = el.closest('.cm-line')
  if (!lineEl) {
    clearLongHover()
    return
  }
  const lines = Array.from(cmContent.querySelectorAll('.cm-line'))
  const lineIndex = lines.indexOf(lineEl)
  if (lineIndex === -1) {
    clearLongHover()
    return
  }

  // Estimate character index using Range
  let charIndex = 0
  try {
    const range = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null
    if (range) {
      // Accumulate text length up to range start within line
      const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT, null)
      while (walker.nextNode()) {
        const node = walker.currentNode
        if (node === range.startContainer) {
          charIndex += range.startOffset
          break
        } else {
          charIndex += node.nodeValue.length
        }
      }
    } else {
      // Fallback: entire line length (approx end)
      charIndex = lineEl.innerText.length
    }
  } catch (err) {}

  const key = lineIndex + ':' + charIndex
  if (longHoverTarget !== key) {
    longHoverTarget = key
    if (longHoverTimer) clearTimeout(longHoverTimer)
    const scheduledX = lastMouseX
    const scheduledY = lastMouseY
    longHoverTimer = setTimeout(
      () => showSyntacticSchema(lineIndex, charIndex, lineEl.innerText, scheduledX, scheduledY),
      LONG_HOVER_MS,
    )
  }
}

function clearLongHover() {
  longHoverTarget = null
  if (longHoverTimer) clearTimeout(longHoverTimer)
  longHoverTimer = null
}

function showSyntacticSchema(line, charIndex, lineText, mouseX, mouseY) {
  const related = currentPhrases.filter(p => p.line === line && p.start <= charIndex && charIndex < p.end)
  if (related.length === 0) {
    syntaxTooltip.style.display = 'none'
    return
  }
  related.sort((a, b) => b.end - b.start - (a.end - a.start))

  const linesOut = []
  linesOut.push(lineText)
  for (const p of related) {
    const overlayChars = Array(lineText.length).fill(' ')
    for (let i = p.start; i < p.end && i < overlayChars.length; i++) overlayChars[i] = '¨'
    linesOut.push(overlayChars.join('') + ' <- ' + p.tag)
  }
  const content = linesOut.join('\n')
  syntaxTooltip.style.display = 'block'
  syntaxTooltip.innerHTML = `<pre style="margin:0;color:#e0e0ff">${escapeHtml(content)}</pre>`
  const lineRect =
    lineText && document.elementFromPoint
      ? document.elementFromPoint(mouseX, mouseY)?.closest('.cm-line')?.getBoundingClientRect()
      : null
  if (lineRect) {
    const errorTooltipVisible = tooltip.style.display === 'block'
    if (errorTooltipVisible) {
      const errorRect = tooltip.getBoundingClientRect()
      syntaxTooltip.style.left = `${lineRect.left + 4}px`
      syntaxTooltip.style.top = `${Math.max(4, errorRect.top - syntaxTooltip.offsetHeight)}px`
    } else {
      syntaxTooltip.style.left = `${lineRect.left + 4}px`
      syntaxTooltip.style.top = `${Math.max(4, lineRect.top - syntaxTooltip.offsetHeight)}px`
    }
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function requestUpdate() {
  if (!isUpdating) {
    isUpdating = true
    requestAnimationFrame(updateHighlights)
  }
}

function updateHighlights() {
  isUpdating = false
  highlightErrors(currentErrors)
  if (spellCheckEnabled) {
    highlightSpellingErrors(currentSpellingErrors)
  }
}

function highlightErrors(errors) {
  let overlay = document.getElementById('hedy-error-overlay-bridge')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'hedy-error-overlay-bridge'
    overlay.style.position = 'fixed'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100vw'
    overlay.style.height = '100vh'
    overlay.style.pointerEvents = 'none'
    overlay.style.zIndex = '20'
    document.body.appendChild(overlay)
  }
  overlay.innerHTML = ''
  highlightRects = []
  if (!errors || errors.length === 0) return
  const editorContainer = document.getElementById('editor')
  if (!editorContainer) return
  const editorEl = editorContainer.querySelector('.cm-content')
  if (!editorEl) return
  const editorRect = editorContainer.getBoundingClientRect()
  const lines = editorEl.querySelectorAll('.cm-line')
  errors.forEach(error => {
    if (lines[error.line]) {
      try {
        console.log('[Syntax] render error', {
          line: error.line,
          start: error.start,
          end: error.end,
          message: error.message,
          code: error.errorCode,
        })
      } catch (_) {}
      createErrorHighlight(error, lines[error.line], overlay, editorRect)
    }
  })
}

function createErrorHighlight(error, lineElement, overlay, editorRect) {
  const text = lineElement.innerText
  if (error.start > text.length) error.start = text.length
  if (error.end > text.length) error.end = text.length
  if (error.start === 0 && error.end === 0 && text.length > 0) error.end = 1
  let currentPos = 0
  let startNode = null,
    startOffset = 0
  let endNode = null,
    endOffset = 0
  function traverse(node) {
    if (node.nodeType === 3) {
      const len = node.nodeValue.length
      if (!startNode && currentPos + len >= error.start) {
        startNode = node
        startOffset = error.start - currentPos
      }
      if (!endNode && currentPos + len >= error.end) {
        endNode = node
        endOffset = error.end - currentPos
      }
      currentPos += len
    } else {
      node.childNodes.forEach(traverse)
    }
  }
  traverse(lineElement)
  if (startNode && endNode) {
    const range = document.createRange()
    try {
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
      const rects = range.getClientRects()
      if (!rects.length) return
      const severity = error.severity || 'error'
      let underlineColor = 'red'
      if (severity === 'warning') underlineColor = 'orange'
      else if (severity === 'info') underlineColor = 'dodgerblue'
      const visible = []
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i]
        if (r.bottom < editorRect.top || r.top > editorRect.bottom) continue
        if (r.right < editorRect.left || r.left > editorRect.right) continue
        // Clip horizontally to the editor viewport to avoid lateral overflow
        const clipped = {
          top: r.top,
          bottom: r.bottom,
          height: r.height,
          left: Math.max(r.left, editorRect.left),
          right: Math.min(r.right, editorRect.right),
          width: Math.max(0, Math.min(r.right, editorRect.right) - Math.max(r.left, editorRect.left)),
        }
        if (clipped.width > 0) visible.push(clipped)
      }
      if (!visible.length) return
      const first = visible[0]
      try {
        console.log(
          '[Syntax] visible rects',
          visible.map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width })),
        )
      } catch (_) {}
      const last = visible[visible.length - 1]
      const waveHeight = 4
      const totalWidth = last.right - first.left
      const el = document.createElement('div')
      el.className = 'hedy-error-mark'
      el.style.position = 'fixed'
      el.style.top = `${first.top + first.height - (waveHeight - 1)}px`
      // Ensure the underline container is clipped inside editor horizontally
      const clippedLeft = Math.max(first.left, editorRect.left)
      const clippedRight = Math.min(visible[visible.length - 1].right, editorRect.right)
      const clippedWidth = Math.max(0, Math.round(clippedRight - clippedLeft))
      el.style.left = `${clippedLeft}px`
      el.style.width = `${clippedWidth}px`
      el.style.height = `${waveHeight}px`
      el.style.pointerEvents = 'none'
      el.style.background = 'transparent'
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', `${totalWidth}`)
      svg.setAttribute('height', `${waveHeight}`)
      svg.setAttribute('viewBox', `0 0 ${totalWidth} ${waveHeight}`)
      svg.style.display = 'block'
      svg.style.position = 'absolute'
      svg.style.top = '0'
      svg.style.left = '0'
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      const segment = 5
      const midline = waveHeight / 2
      const amp = 1.4
      let d = ''
      for (let i = 0; i < visible.length; i++) {
        const rect = visible[i]
        const startX = Math.max(rect.left, editorRect.left) - clippedLeft
        const width = rect.width
        d += `M${startX} ${midline}`
        for (let x = 0; x < width; ) {
          const remaining = width - x
          const seg = remaining >= segment ? segment : remaining
          const q1 = startX + x + seg * 0.2
          const mid = startX + x + seg / 2
          const q3 = startX + x + seg * 0.8
          const next = startX + x + seg
          d += ` Q ${q1} ${midline + amp} ${mid} ${midline}`
          d += ` Q ${q3} ${midline - amp} ${next} ${midline}`
          x += seg
        }
        highlightRects.push({
          rect: rect,
          message: error.message,
          errorCode: error.errorCode,
          severity: severity,
          anchorLeft: first.left,
          anchorTop: first.top,
        })
      }
      path.setAttribute('d', d)
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', underlineColor)
      path.setAttribute('stroke-width', '1.15')
      path.setAttribute('stroke-linejoin', 'round')
      path.setAttribute('stroke-linecap', 'round')
      svg.appendChild(path)
      el.appendChild(svg)
      overlay.appendChild(el)
      try {
        console.log('[Syntax] placed underline', { left: el.style.left, width: el.style.width, top: el.style.top })
      } catch (_) {}
    } catch (e) {
      console.error('Hedy Bridge: Failed to get range rects', e)
    }
  }
}

function getTextWidth(text, font) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'))
  const context = canvas.getContext('2d')
  context.font = font
  const metrics = context.measureText(text)
  return metrics.width
}

function highlightSpellingErrors(errors) {
  let overlay = document.getElementById('hedy-spelling-overlay-bridge')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'hedy-spelling-overlay-bridge'
    overlay.style.position = 'fixed'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100vw'
    overlay.style.height = '100vh'
    overlay.style.pointerEvents = 'none'
    overlay.style.zIndex = '21'
    document.body.appendChild(overlay)
  }
  overlay.innerHTML = ''
  spellingHighlightRects = []
  if (!errors || errors.length === 0) return
  const editorContainer = document.getElementById('editor')
  if (!editorContainer) return
  const editorEl = editorContainer.querySelector('.cm-content')
  if (!editorEl) return
  const editorRect = editorContainer.getBoundingClientRect()
  const lines = editorEl.querySelectorAll('.cm-line')
  errors.forEach(error => {
    if (lines[error.line]) {
      try {
        console.log('[Spelling] render error', {
          line: error.line,
          start: error.start,
          end: error.end,
          message: error.message,
          suggestions: error.suggestions,
        })
      } catch (_) {}
      createSpellingHighlight(error, lines[error.line], overlay, editorRect)
    }
  })
}

function createSpellingHighlight(error, lineElement, overlay, editorRect) {
  const text = lineElement.innerText
  let start = error.start
  let end = error.end
  if (start > text.length) start = text.length
  if (end > text.length) end = text.length
  if (start === end && text.length > 0) end = start + 1

  let currentPos = 0
  let startNode = null
  let startOffset = 0
  let endNode = null
  let endOffset = 0

  function traverse(node) {
    if (node.nodeType === 3) {
      const len = node.nodeValue.length
      if (!startNode && currentPos + len >= start) {
        startNode = node
        startOffset = start - currentPos
      }
      if (!endNode && currentPos + len >= end) {
        endNode = node
        endOffset = end - currentPos
      }
      currentPos += len
    } else {
      node.childNodes.forEach(traverse)
    }
  }

  traverse(lineElement)

  if (startNode && endNode) {
    const range = document.createRange()
    try {
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
      const rects = range.getClientRects()
      if (!rects.length) return

      const visible = []
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i]
        if (r.bottom < editorRect.top || r.top > editorRect.bottom) continue
        if (r.right < editorRect.left || r.left > editorRect.right) continue
        // Clip horizontally to the editor viewport
        const clipped = {
          top: r.top,
          bottom: r.bottom,
          height: r.height,
          left: Math.max(r.left, editorRect.left),
          right: Math.min(r.right, editorRect.right),
          width: Math.max(0, Math.min(r.right, editorRect.right) - Math.max(r.left, editorRect.left)),
        }
        if (clipped.width > 0) visible.push(clipped)
      }
      if (!visible.length) return

      const first = visible[0]
      try {
        console.log(
          '[Spelling] visible rects',
          visible.map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width })),
        )
      } catch (_) {}
      const waveHeight = 3
      const totalWidth = visible[visible.length - 1].right - first.left

      const el = document.createElement('div')
      el.style.position = 'fixed'
      el.style.top = `${first.top + first.height - (waveHeight - 1)}px`
      // Ensure underline stays within editor viewport horizontally
      const clippedLeft = Math.max(first.left, editorRect.left)
      const clippedRight = Math.min(visible[visible.length - 1].right, editorRect.right)
      const clippedWidth = Math.max(0, Math.round(clippedRight - clippedLeft))
      el.style.left = `${clippedLeft}px`
      el.style.width = `${clippedWidth}px`
      el.style.height = `${waveHeight}px`
      el.style.pointerEvents = 'none'
      el.style.background = 'transparent'

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', `${totalWidth}`)
      svg.setAttribute('height', `${waveHeight}`)
      svg.setAttribute('viewBox', `0 0 ${totalWidth} ${waveHeight}`)
      svg.style.display = 'block'
      svg.style.position = 'absolute'
      svg.style.top = '0'
      svg.style.left = '0'

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      const segment = 4
      const midline = waveHeight / 2
      const amp = 1.0
      let d = ''

      for (let i = 0; i < visible.length; i++) {
        const rect = visible[i]
        const startX = Math.max(rect.left, editorRect.left) - clippedLeft
        const width = rect.width
        d += `M${startX} ${midline}`
        for (let x = 0; x < width; ) {
          const remaining = width - x
          const seg = remaining >= segment ? segment : remaining
          const q1 = startX + x + seg * 0.2
          const mid = startX + x + seg / 2
          const q3 = startX + x + seg * 0.8
          const next = startX + x + seg
          d += ` Q ${q1} ${midline + amp} ${mid} ${midline}`
          d += ` Q ${q3} ${midline - amp} ${next} ${midline}`
          x += seg
        }
        const suggestions = Array.isArray(error.suggestions)
          ? error.suggestions
          : Array.isArray(error.replacements)
          ? error.replacements.map(r => (typeof r === 'string' ? r : r && r.value)).filter(Boolean)
          : []
        spellingHighlightRects.push({
          rect: rect,
          message: error.message,
          suggestions: suggestions,
          line: error.line,
          start: error.start,
          end: error.end,
        })
      }

      path.setAttribute('d', d)
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', '#0a9d0a')
      path.setAttribute('stroke-width', '1.15')
      path.setAttribute('stroke-linejoin', 'round')
      path.setAttribute('stroke-linecap', 'round')

      svg.appendChild(path)
      el.appendChild(svg)
      overlay.appendChild(el)
      try {
        console.log('[Spelling] placed underline', { left: el.style.left, width: el.style.width, top: el.style.top })
      } catch (_) {}
    } catch (e) {
      console.error('Hedy Bridge: Failed to highlight spelling error', e)
    }
  }
}

function replaceSpellingError(errorItem, suggestion) {
  try {
    const editorContainer = document.getElementById('editor')
    if (!editorContainer) return

    const editorEl = editorContainer.querySelector('.cm-content')
    if (!editorEl) return

    const lines = editorEl.querySelectorAll('.cm-line')
    const lineElement = lines[errorItem.line]
    if (!lineElement) return

    // Try multiple ways to get the CodeMirror editor
    let editorView = window.cm || window.editor

    // If not found in window, try to find it in hedyApp
    if (!editorView && window.hedyApp) {
      editorView = window.hedyApp.editor
    }

    if (!editorView || !editorView.dispatch) {
      // Fallback: directly modify the text by simulating user input
      console.warn('CodeMirror view not found, attempting alternative replacement')
      replaceViaSimulation(errorItem, suggestion)
      return
    }

    // Calculate absolute positions in the document
    let currentPos = 0
    for (let i = 0; i < errorItem.line; i++) {
      currentPos += (lines[i]?.innerText?.length || 0) + 1 // +1 for newline
    }

    const startPos = currentPos + errorItem.start
    const endPos = currentPos + errorItem.end

    // Replace using CodeMirror's dispatch
    editorView.dispatch({
      changes: {
        from: startPos,
        to: endPos,
        insert: suggestion,
      },
    })

    spellCheckTooltip.style.display = 'none'
    currentSpellingError = null
    requestUpdate()
  } catch (e) {
    console.error('Failed to replace spelling error:', e)
  }
}

function replaceViaSimulation(errorItem, suggestion) {
  try {
    // Check if editor is read-only
    if (window.hedyApp && window.hedyApp.theGlobalEditor && window.hedyApp.theGlobalEditor.isReadOnly) {
      console.warn('Editor is read-only, cannot make changes')
      return
    }

    // Get current code
    let code = ''
    if (window.hedyApp && window.hedyApp.theGlobalEditor && window.hedyApp.theGlobalEditor.contents) {
      code = window.hedyApp.theGlobalEditor.contents
    } else if (window.hedyApp && typeof window.hedyApp.getEditorContents === 'function') {
      code = window.hedyApp.getEditorContents()
    } else if (window.hedyApp && typeof window.hedyApp.get_active_and_trimmed_code === 'function') {
      code = window.hedyApp.get_active_and_trimmed_code()
    }

    if (!code) return

    // Split into lines
    const codeLines = code.split('\n')
    if (errorItem.line >= codeLines.length) return

    const line = codeLines[errorItem.line]
    const before = line.substring(0, errorItem.start)
    const after = line.substring(errorItem.end)
    codeLines[errorItem.line] = before + suggestion + after

    // Set the new code
    const newCode = codeLines.join('\n')
    if (window.hedyApp && window.hedyApp.theGlobalEditor) {
      window.hedyApp.theGlobalEditor.contents = newCode
    } else if (window.hedyApp && typeof window.hedyApp.setEditorContents === 'function') {
      window.hedyApp.setEditorContents(newCode)
    } else if (window.hedyApp && typeof window.hedyApp.set_code === 'function') {
      window.hedyApp.set_code(newCode)
    }

    spellCheckTooltip.style.display = 'none'
    currentSpellingError = null

    // Trigger code update
    setTimeout(checkAndSendCode, 100)
    requestUpdate()
  } catch (e) {
    console.error('Failed to replace via simulation:', e)
  }
}
