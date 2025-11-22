function checkAndSendCode() {
    let code = '';
    let level = 1;
    let source = 'none';

    // 1. Try hedyApp
    if (window.hedyApp) {
        // Get Level
        if (window.hedyApp.theLevel) {
            level = parseInt(window.hedyApp.theLevel);
        }

        // Get Code - Prioritize getEditorContents to avoid trimming spaces
        if (typeof window.hedyApp.getEditorContents === 'function') {
            code = window.hedyApp.getEditorContents();
            source = 'hedyApp.getEditorContents';
        } else if (typeof window.hedyApp.get_active_and_trimmed_code === 'function') {
            code = window.hedyApp.get_active_and_trimmed_code();
            source = 'hedyApp.get_active_and_trimmed_code';
        }
    }

    // 2. Try DOM (Fallback)
    if (!code) {
        const editorContainer = document.getElementById('editor');
        if (editorContainer) {
            const cmContent = editorContainer.querySelector('.cm-content');
            if (cmContent) {
                code = cmContent.innerText;
                source = 'DOM #editor .cm-content';
            }
        }
    }

    if (code) {
        // console.log(`Hedy Bridge: Sending code (${code.length} chars) via ${source}`);
        window.postMessage({ type: 'HEDY_CODE_UPDATE', code: code, level: level }, '*');
    }
}

// Poll every 1 second
setInterval(checkAndSendCode, 1000);

// Also listen for user interaction to trigger immediately
document.addEventListener('keyup', () => {
    // Debounce slightly
    setTimeout(checkAndSendCode, 100);
});

let currentErrors = [];
let highlightRects = []; // Store rects for manual hit testing
let isUpdating = false;

// Highlighting Logic (Listen for errors from extension)
window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data.type) return;

    if (event.data.type === 'HEDY_HIGHLIGHT_ERRORS') {
        currentErrors = event.data.errors;
        requestUpdate();
    }
});

// Listen for scroll and resize events to update positions
window.addEventListener('scroll', requestUpdate, { capture: true, passive: true });
window.addEventListener('resize', requestUpdate, { passive: true });

// Custom Tooltip Logic
const tooltip = document.createElement('div');
tooltip.className = 'hedy-error-tooltip';
tooltip.style.position = 'fixed';
tooltip.style.background = '#333';
tooltip.style.color = 'white';
tooltip.style.padding = '4px 8px';
tooltip.style.borderRadius = '4px';
tooltip.style.fontSize = '12px';
tooltip.style.zIndex = '2147483647';
tooltip.style.pointerEvents = 'none';
tooltip.style.display = 'none';
tooltip.style.maxWidth = '300px';
document.body.appendChild(tooltip);

window.addEventListener('mousemove', (e) => {
    let hovered = false;
    for (const item of highlightRects) {
        if (e.clientX >= item.rect.left &&
            e.clientX <= item.rect.right &&
            e.clientY >= item.rect.top &&
            e.clientY <= item.rect.bottom) {

            tooltip.innerText = item.message;
            tooltip.style.left = `${e.clientX + 10}px`;
            tooltip.style.top = `${e.clientY + 10}px`;
            tooltip.style.display = 'block';
            hovered = true;
            break;
        }
    }
    if (!hovered) {
        tooltip.style.display = 'none';
    }
}, { passive: true });

function requestUpdate() {
    if (!isUpdating) {
        isUpdating = true;
        requestAnimationFrame(updateHighlights);
    }
}

function updateHighlights() {
    isUpdating = false;
    highlightErrors(currentErrors);
}

function highlightErrors(errors) {
    let overlay = document.getElementById('hedy-error-overlay-bridge');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'hedy-error-overlay-bridge';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.pointerEvents = 'none'; // Crucial: Let clicks pass through!
        overlay.style.zIndex = '2147483647';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = '';
    highlightRects = []; // Reset hit testing rects

    if (!errors || errors.length === 0) return;

    const editorContainer = document.getElementById('editor');
    if (!editorContainer) return;
    const editorEl = editorContainer.querySelector('.cm-content');
    if (!editorEl) return;

    // Get editor bounds for clipping
    const editorRect = editorContainer.getBoundingClientRect();

    const lines = editorEl.querySelectorAll('.cm-line');

    errors.forEach(error => {
        if (lines[error.line]) {
            createErrorHighlight(error, lines[error.line], overlay, editorRect);
        }
    });
}

function createErrorHighlight(error, lineElement, overlay, editorRect) {
    const text = lineElement.innerText;
    if (error.start > text.length) error.start = text.length;
    if (error.end > text.length) error.end = text.length;

    // Find the text nodes for the range
    let currentPos = 0;
    let startNode = null, startOffset = 0;
    let endNode = null, endOffset = 0;

    function traverse(node) {
        if (node.nodeType === 3) { // Text node
            const len = node.nodeValue.length;
            if (!startNode && currentPos + len >= error.start) {
                startNode = node;
                startOffset = error.start - currentPos;
            }
            if (!endNode && currentPos + len >= error.end) {
                endNode = node;
                endOffset = error.end - currentPos;
            }
            currentPos += len;
        } else {
            node.childNodes.forEach(traverse);
        }
    }

    traverse(lineElement);

    if (startNode && endNode) {
        const range = document.createRange();
        try {
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);

            const rects = range.getClientRects();
            for (let i = 0; i < rects.length; i++) {
                const rect = rects[i];

                // Clipping
                if (rect.bottom < editorRect.top || rect.top > editorRect.bottom) continue;
                if (rect.right < editorRect.left || rect.left > editorRect.right) continue;

                const el = document.createElement('div');
                el.className = 'hedy-error-mark';
                el.style.position = 'fixed';
                el.style.top = `${rect.top}px`;
                el.style.left = `${rect.left}px`;
                el.style.width = `${rect.width}px`;
                el.style.height = `${rect.height}px`;

                // Visuals
                el.style.borderBottom = '2px solid red';
                el.style.backgroundColor = 'rgba(255, 0, 0, 0)';

                // Interaction: POINTER EVENTS NONE to allow editing
                el.style.pointerEvents = 'none';

                overlay.appendChild(el);

                // Store for manual hit testing (tooltip)
                highlightRects.push({
                    rect: rect,
                    message: error.message
                });
            }
        } catch (e) {
            console.error('Hedy Bridge: Failed to get range rects', e);
        }
    } else {
        // console.warn('Hedy Bridge: Could not find text nodes for error range');
    }
}

function getTextWidth(text, font) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}
