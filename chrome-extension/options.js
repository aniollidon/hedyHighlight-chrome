;(function () {
  const chk = document.getElementById('longHoverSyntax')
  const status = document.getElementById('status')

  function setStatus(msg) {
    status.textContent = msg
  }

  chrome.storage.sync.get({ longHoverSyntaxEnabled: false }, data => {
    chk.checked = !!data.longHoverSyntaxEnabled
    setStatus('Estat carregat')
  })

  chk.addEventListener('change', () => {
    setStatus('Guardant...')
    chrome.storage.sync.set({ longHoverSyntaxEnabled: chk.checked }, () => {
      setStatus('Guardat')
    })
  })
})()
