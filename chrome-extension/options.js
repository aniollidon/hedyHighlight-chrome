;(function () {
  const longHoverChk = document.getElementById('longHoverSyntax')
  const spellCheckChk = document.getElementById('spellCheckEnabled')
  const extensionLang = document.getElementById('extensionLanguage')
  const status = document.getElementById('status')

  function setStatus(msg) {
    status.textContent = msg
  }

  chrome.storage.sync.get(
    {
      longHoverSyntaxEnabled: false,
      spellCheckEnabled: true,
      extensionLanguage: 'ca',
    },
    data => {
      longHoverChk.checked = !!data.longHoverSyntaxEnabled
      spellCheckChk.checked = !!data.spellCheckEnabled
      extensionLang.value = data.extensionLanguage || 'ca'
      setStatus('Estat carregat')
    },
  )

  function saveSettings() {
    setStatus('Guardant...')
    chrome.storage.sync.set(
      {
        longHoverSyntaxEnabled: longHoverChk.checked,
        spellCheckEnabled: spellCheckChk.checked,
        extensionLanguage: extensionLang.value,
      },
      () => {
        setStatus('Guardat')
      },
    )
  }

  longHoverChk.addEventListener('change', saveSettings)
  spellCheckChk.addEventListener('change', saveSettings)
  extensionLang.addEventListener('change', saveSettings)
})()
