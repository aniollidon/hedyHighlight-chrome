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
let highlightRects = []
let isUpdating = false

window.addEventListener('message', event => {
  if (event.source !== window || !event.data.type) return
  if (event.data.type === 'HEDY_HIGHLIGHT_ERRORS') {
    currentErrors = event.data.errors
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
tooltip.style.maxWidth = '360px'
tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)'
tooltip.style.whiteSpace = 'pre-wrap'
tooltip.style.userSelect = 'none'
document.body.appendChild(tooltip)

window.addEventListener(
  'mousemove',
  e => {
    let hovered = false
    for (const item of highlightRects) {
      if (
        e.clientX >= item.rect.left &&
        e.clientX <= item.rect.right &&
        e.clientY >= item.rect.top &&
        e.clientY <= item.rect.bottom
      ) {
        tooltip.innerText = item.message
        tooltip.style.display = 'block'
        tooltip.style.left = `${e.clientX + 10}px`
        tooltip.style.top = `${e.clientY + 10}px`
        hovered = true
        break
      }
    }
    if (!hovered) tooltip.style.display = 'none'
  },
  { passive: true },
)

window.addEventListener(
  'mousemove',
  e => {
    let hovered = false
    for (const item of highlightRects) {
      if (
        e.clientX >= item.rect.left &&
        e.clientX <= item.rect.right &&
        e.clientY >= item.rect.top &&
        e.clientY <= item.rect.bottom
      ) {
        tooltip.innerText = item.message
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
        let desiredTop = anchorTop - (height + 2)
        let placeBelow = false
        if (desiredTop < 4) {
          desiredTop = anchorTop + item.rect.height + 2
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
    if (!hovered) tooltip.style.display = 'none'
  },
  { passive: true },
)

function requestUpdate() {
  if (!isUpdating) {
    isUpdating = true
    requestAnimationFrame(updateHighlights)
  }
}

function updateHighlights() {
  isUpdating = false
  highlightErrors(currentErrors)
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
        visible.push(r)
      }
      if (!visible.length) return
      const first = visible[0]
      const last = visible[visible.length - 1]
      const waveHeight = 4
      const totalWidth = last.right - first.left
      const el = document.createElement('div')
      el.className = 'hedy-error-mark'
      el.style.position = 'fixed'
      el.style.top = `${first.top + first.height - (waveHeight - 1)}px`
      el.style.left = `${first.left}px`
      el.style.width = `${totalWidth}px`
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
        const startX = rect.left - first.left
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
