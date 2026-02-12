import * as def from './definitions/definitions.js'
import { enUnaLlista, getDefinitionType } from './types.js'
import { clone } from '../utils.js'

class EntityDefinitions {
  constructor(level) {
    this._level = level
    this._hasNumbers = def.NUMBERS.at(level)
    this._hasBooleans = def.BOOLEANS.at(level)
    this._hasScopes = def.USES_SCOPE.at(level)
    this._define_var_by_for = def.CMD_FOR.at(level)
    this._define_functions = def.FUNCIONS.at(level)
    this._define_fun_with = def.FUNCTIONS_WITH.at(level)
    this._return_fun = def.RETURN_FUNCTION.at(level)

    this.tokens = []
    this.entities = {}
  }

  clean() {
    this.tokens = []
    this.entities = {}
  }

  #setEntity(word, type, scope, lineNumber, subtype = 'value_mixed') {
    const name = word.text
    const startChar = word.pos
    if (name === '_') return

    if (this.entities[name] !== undefined && !this.entities[name].outOfScope) {
      if (subtype != this.entities[name].subtype || type != this.entities[name].type) {
        this.entities[name].changes.push({
          line: lineNumber,
          char: startChar,
          scope: scope,
          oldType: this.entities[name].type,
          newType: type,
          oldSubtype: this.entities[name].subtype,
          newSubtype: subtype,
        })

        this.entities[name].type = type // Segur?¿
        this.entities[name].subtype = subtype //'value_mixed'
      }
    } else {
      this.entities[name] = {
        name: name,
        defLine: lineNumber,
        defChar: startChar,
        scope: scope,
        type: type,
        subtype: subtype,
        changes: [],
      }
    }

    this.#tagIt(word, this.entities[name], lineNumber, type, ['declaration'])
  }

  #tagIt(word, entity, line, type, modifiers = []) {
    // Si és la definició, haurem d'esborrar l'ús
    if (modifiers.includes('declaration')) {
      this.tokens = this.tokens.filter(
        token =>
          !(
            token.line === line &&
            token.startChar === word.pos &&
            token.entity.name === entity.name &&
            token.modifiers.includes('use')
          ),
      )
    }

    this.tokens.push({
      entity: clone(entity),
      line: line,
      startChar: word.pos,
      length: word.text.length,
      type: type,
      modifiers: modifiers,
    })
  }

  analizeLine(words, lineNumber, scope = 0) {
    // Posa a lloc les variables que s'han de setejar a la següent posició i esborra aquelles fora de l'abast
    for (const variableName in this.entities) {
      if (this.entities[variableName].scope === undefined) {
        this.entities[variableName].scope = scope
        continue
      }

      if (this._hasScopes && scope < this.entities[variableName].scope) {
        // TODO: NO s'ha de borrar el nom de la variable si el scope és més petit que el de la variable (... o sí?)
        // De fet, a l'scope de funcions s'ha de borrar SEGUR
        // A la resta no és bona praxis, però no és incorrecte
        this.entities[variableName].outOfScope = true
      }
    }

    // Busca referències a variables
    for (const variableName in this.entities) {
      for (let j = 0; j < words.length; j++) {
        if (words[j].text !== variableName) continue

        //if (enUnaLlista(words, j)) continue

        if (!this.entities[variableName].outOfScope) {
          this.#tagIt(words[j], this.entities[variableName], lineNumber, this.entities[variableName].type, ['use'])
        }
      }
    }

    // Busca declaracions de variables
    let i = 0
    while (i < words.length) {
      if (
        i + 1 < words.length &&
        (words[i + 1].command === 'variable_define_is' || words[i + 1].command === 'variable_define_equal')
      ) {
        const subtype = getDefinitionType(words.slice(i + 2), this.entities, this._hasBooleans)
        this.#setEntity(words[i], 'variable', scope, lineNumber, subtype)
        i += 2
      } else {
        i++
      }
    }

    // Busca declaracions entre for i in
    i = 0
    if (this._define_var_by_for)
      while (i + 2 < words.length) {
        if (words[i].command === 'for' && words[i + 2].command === 'in') {
          this.#setEntity(words[i + 1], 'variable', undefined, lineNumber) // Scope undefined i serà posat a la següent línia
          i += 3
        } else {
          i++
        }
      }

    // Busca declaracions de funcions i paràmetres
    i = 0
    if (this._define_functions)
      while (i + 1 < words.length) {
        if (words[i].command === 'define' || words[i].command === 'def') {
          const funcName = words[i + 1].text
          this.#setEntity(words[i + 1], 'function', scope, lineNumber)
          i += 2

          // Busca paràmetres entre parèntesis: define FUNC(PARAM1, PARAM2, ...)
          if (i < words.length && words[i].command === 'parenthesis_open') {
            i++ // Skip '('
            let paramCount = 0
            while (i < words.length && words[i].command !== 'parenthesis_close') {
              if (words[i].command !== 'comma') {
                this.#setEntity(words[i], 'parameter', undefined, lineNumber)
                paramCount++
              }
              i++
            }
            if (i < words.length) i++ // Skip ')'
            if (this.entities[funcName]) {
              this.entities[funcName].params = paramCount
            }
          }
        } else {
          i++
        }
      }

    /*
    // Busca declaracions de funcions amb with
    if (this._define_fun_with) {
      const withRegex = /define +([\p{L}_\d]+) with +(.+)/gu
      let withMatch
      while ((withMatch = withRegex.exec(text)) !== null) {
        const functionName = withMatch[1]
        const params = withMatch[2].split(',')
        for (const param of params) {
          const paramName = param.trim()
          const startChar = withMatch.index + withMatch[0].indexOf(paramName)

          if (paramName.startsWith("'") || paramName.startsWith('"') || !paramName) continue

          this.#setEntity(paramName, 'parameter', undefined, lineNumber, startChar)

          this.tokens.push({
            line: lineNumber,
            startChar: startChar,
            length: paramName.length,
            type: 'parameter',
            modifiers: ['declaration'],
          })
        }

        // Find previous function declaration on names
        this.entities[functionName].params = params
      }
    }

    // Busca retorn de funcions
    if (this._return_fun) {
      const returnRegex = new RegExp('^( *)return ', 'gu')
      let match3
      while ((match3 = returnRegex.exec(text)) !== null) {
        const identation = match3[1].length
        // Find previous function declaration on names
        const variableNames = Object.keys(this.entities)
        for (let i = variableNames.length - 1; i >= 0; i--) {
          const variableName = variableNames[i]
          if (this.entities[variableName].type === 'function' && this.entities[variableName].defLine < lineNumber) {
            this.entities[variableName].return = true
            break
          }
        }
      }
    }

    // Busca usos de funcions per importar
    if (this._define_functions) {
      const importFunDeclRegex = new RegExp('^# *! *import +(.*) +from +[\\p{L}_\\d]+', 'gu')
      let match2
      while ((match2 = importFunDeclRegex.exec(text)) !== null) {
        let functionsToimportText = match2[1]

        if (!functionsToimportText) continue

        const defFunctions = parseImportFunctions(functionsToimportText)

        for (const funct of defFunctions) {
          const functionName = funct.name
          const startChar = text.indexOf(functionName)

          if (!functionName || startChar < 0) continue

          this.#setEntity(functionName, 'function', 0, lineNumber, startChar)

          this.tokens.push({
            line: lineNumber,
            startChar: startChar,
            length: functionName.length,
            type: 'function',
            modifiers: ['declaration'],
          })
        }
      }
    }

    */
  }

  finalCheck() {
    // Comprova que totes les definicions tenen ús
    const unUsed = []

    for (const name in this.entities) {
      const entity = this.entities[name]

      // Busca si hi ha algun token d'ús per aquesta entitat
      const hasUsage = this.tokens.some(token => token.entity.name === entity.name && token.modifiers.includes('use'))

      if (!hasUsage) {
        unUsed.push(entity)
      }
    }

    return { unUsed: unUsed }
  }

  getEntity(line, char) {
    for (const token of this.tokens) {
      if (token.line === line && token.startChar === char) {
        return token.entity
      }
    }
    return undefined
  }
}

export { EntityDefinitions }
