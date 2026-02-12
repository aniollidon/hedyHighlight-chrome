import { Sintagma } from './sintagma.js'
import * as def from './definitions/definitions.js'

class Memory {
  constructor(level) {
    this.past = []
    this._partialcount = 0
    this._hasScopes = def.USES_SCOPE.at(level)
    this._definedScopeIdentation = -1 //Nombre de caràcters definits per a identar
    this._scopes = [0]
  }

  /*
   * Es crida un cop per cada sintagma (part de la frase) que es vol analitzar
   * només en els inline es diferencia de les línies senceres
   */
  newSintagma(words, identation, lineNumber) {
    let sintagmaTag = 'action'
    let parentTag = undefined
    if (words[0].command === 'if' || words[0].command === 'elif') sintagmaTag = 'condition'
    else if (words[0].command === 'else') sintagmaTag = 'condition_else'
    else if (words[0].command === 'repeat' || words[0].command === 'for' || words[0].command === 'while')
      sintagmaTag = 'loop'
    else if (words[0].command === 'define' || words[0].command === 'def') sintagmaTag = 'function_definition'

    if (this.last() !== undefined && this.last().linenum === lineNumber) {
      this._partialcount++
      parentTag = this.last().sintagmaTag // Manté el tag del primer sintagma de la línia
    } else {
      this._partialcount = 0
    }

    if (!this._hasScopes) {
      // Etiqueta el parentTag d'una condició/bucle si la línia anterior ho era
      if (
        this.last() !== undefined &&
        (this.last().sintagmaTag.startsWith('condition') || this.last().sintagmaTag === 'loop')
      ) {
        parentTag = this.last().sintagmaTag
      }
    } else {
      // Etiqueta el parentTag d'una condició/bucle si l'identació anterior menor ho era
      for (let i = this.past.length - 1; i >= 0; i--) {
        const sintagmaPast = this.past[i]
        // Si trobem una identació igual o major -> ignorem
        // Si trobem una identació menor -> és el parent. Usem i sortim
        if (sintagmaPast.identation < identation) {
          if (sintagmaPast.sintagmaTag.startsWith('condition') || sintagmaPast.sintagmaTag === 'loop') {
            parentTag = sintagmaPast.sintagmaTag
          }
          break
        }
      }
    }

    if (identation > 0 && this._definedScopeIdentation === -1) this._definedScopeIdentation = identation // Defineix la identació dels scopes

    if (identation > this._scopes[this._scopes.length - 1]) {
      this._scopes.push(identation)
    } else if (identation < this._scopes[this._scopes.length - 1]) {
      // Borra tots els scopes que ja no són vàlids
      while (identation < this._scopes[this._scopes.length - 1]) {
        this._scopes.pop()
      }
    }

    const sintagma = new Sintagma(lineNumber, this._partialcount, 0, words, identation, sintagmaTag, parentTag)
    this.past.push(sintagma)
    return sintagma
  }

  /*
   * Retorna l'últim sintagma
   */
  last() {
    if (this.past.length === 0) return undefined
    return this.past[this.past.length - 1]
  }

  finalCheck() {
    // Comprova que tots els scopes estiguin tancats
    const tagPast = this.last() !== undefined ? this.last().sintagmaTag : 'action'
    const pastIdentable =
      tagPast === 'condition' || tagPast === 'condition_else' || tagPast === 'loop' || tagPast === 'function_definition'

    if (pastIdentable) return 'expected'
    return true
  }

  cercaIf(searchScoped = false, onScope = -1) {
    // Cerca l'últim if. Navegant enrere s'ha de trobar un condition abans que 2 o més actions.
    let countActions = 0
    for (let i = this.past.length - 2; i >= 0; i--) {
      // A tenir en compte que es comprova un cop ja hi ha la línia actual (per xo el -2)
      const sintagma = this.past[i]

      if (searchScoped && sintagma.identation !== onScope) continue
      if (sintagma.sintagmaTag === 'condition') return true
      if (sintagma.sintagmaTag === 'condition_else') return false
      if (sintagma.sintagmaTag === 'action') countActions++
      if (countActions >= 2) return false
    }
    return false
  }

  getDefinedIdentation(ifnotdef = 4) {
    return this._definedScopeIdentation !== -1 ? this._definedScopeIdentation : ifnotdef
  }

  comprovaScope(identation) {
    // Hi ha d'haver una condition//condition_else o un bucle a l'scope anterior
    // La separació entre scopes es manté

    const identPast = this.last() !== undefined ? this.last().identation : 0
    const tagPast = this.last() !== undefined ? this.last().sintagmaTag : 'action'
    const pastIdentable =
      tagPast === 'condition' || tagPast === 'condition_else' || tagPast === 'loop' || tagPast === 'function_definition'

    // L'identació ha de ser múltiple de la definida
    if (identation > 0 && this._definedScopeIdentation !== -1 && identation % this._definedScopeIdentation !== 0)
      return 'missaligned'

    if (identation === identPast) {
      if (pastIdentable) return 'expected'
      return true
    } else if (identation > identPast) {
      if (pastIdentable)
        if (this._definedScopeIdentation != -1 && identPast + this._definedScopeIdentation !== identation)
          return 'large'
        else return true
      return 'not_expected'
    } else {
      // identation < identPast
      if (this._scopes.includes(identation) && !pastIdentable) return true
      return pastIdentable ? 'small' : 'not_expected'
    }
  }

  isScopeRecursive(identation) {
    const identPast = this.last() !== undefined ? this.last().identation : 0

    // Augmentem l'scope però aquest ja té un scope anterior
    if (identation > identPast && this._scopes.length > 1) return true
    return false
  }
}

export { Memory }
