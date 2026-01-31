import * as english from './english.js'
import * as catalan from './catala.js'

class LangHandler {
  constructor(def = 'ca') {
    this.setLang(def)
    this.currentLang = def
  }

  setLang(lang) {
    if (lang === 'en') {
      this.command2text = english.command2text
      this.type2text = english.type2text
      this.error2text = english.error2text
      this.getText = english.getText
      this.isColor = english.isColor
    } else {
      // default to catalan
      this.command2text = catalan.command2text
      this.type2text = catalan.type2text
      this.error2text = catalan.error2text
      this.getText = catalan.getText
      this.isColor = catalan.isColor
    }
  }
}

const langHandler = new LangHandler()
export default langHandler
