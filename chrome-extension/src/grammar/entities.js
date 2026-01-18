import * as def from './definitions/definitions.js'
import { enUnaLlista, getDefinitionType } from './types.js'

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
    this.names = {}
  }

  clean() {
    this.tokens = []
    this.names = {}
  }

  #setEntity(name, type, scope, lineNumber, startChar, subtype = 'value_mixed') {
    if (name === '_') return

    if (this.names[name] !== undefined && !this.names[name].outOfScope) {
      if (subtype != this.names[name].subtype || type != this.names[name].type) {
        this.names[name].changes.push({
          line: lineNumber,
          char: startChar,
          scope: scope,
          oldType: this.names[name].type,
          newType: type,
          oldSubtype: this.names[name].subtype,
          newSubtype: subtype,
        })

        this.names[name].subtype = 'value_mixed'
      }
    } else {
      this.names[name] = {
        defLine: lineNumber,
        defChar: startChar,
        scope: scope,
        type: type,
        subtype: subtype,
        changes: [],
      }
    }
  }

  #tagIt(word, objname, line, type, modifiers = []) {
    this.tokens.push({
      entity: objname,
      line: line,
      startChar: word.pos,
      length: word.text.length,
      type: type,
      modifiers: modifiers,
    })
  }

  analizeLine(words, lineNumber, scope = 0) {
    // Posa a lloc les variables que s'han de setejar a la següent posició i esborra aquelles fora de l'abast
    for (const variableName in this.names) {
      if (this.names[variableName].scope === undefined) {
        this.names[variableName].scope = scope
        continue
      }

      if (this._hasScopes && scope < this.names[variableName].scope) {
        // TODO: NO s'ha de borrar el nom de la variable si el scope és més petit que el de la variable (... o sí?)
        // De fet, a l'scope de funcions s'ha de borrar SEGUR
        // A la resta no és bona praxis, però no és incorrecte
        this.names[variableName].outOfScope = true
      }
    }

    // Busca declaracions de variables
    let i = 0
    while (i < words.length) {
      if (
        i + 1 < words.length &&
        (words[i + 1].command === 'variable_define_is' || words[i + 1].command === 'variable_define_equal')
      ) {
        const variableName = words[i].text
        const startChar = words[i].pos
        const subtype = getDefinitionType(words.slice(i + 2), this.names, this._hasBooleans)

        this.#setEntity(variableName, 'variable', scope, lineNumber, startChar, subtype)
        this.#tagIt(words[i], this.names[variableName], lineNumber, 'variable', ['declaration'])
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
          const variableName = words[i + 1].text
          const startChar = words[i + 1].pos
          this.#setEntity(variableName, 'variable', undefined, lineNumber, startChar) // Scope undefined i serà posat a la següent línia
          this.#tagIt(words[i + 1], this.names[variableName], lineNumber, 'variable', ['declaration'])
          i += 3
        } else {
          i++
        }
      }

    // Busca declaracions de funcions
    i = 0
    if (this._define_functions)
      while (i + 1 < words.length) {
        if (words[i].command === 'define') {
          const functionName = words[i + 1].text
          const startChar = words[i + 1].pos
          this.#setEntity(functionName, 'function', scope, lineNumber, startChar)
          this.#tagIt(words[i + 1], this.names[functionName], lineNumber, 'function', ['declaration'])
          i += 2
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
        this.names[functionName].params = params
      }
    }

    // Busca retorn de funcions
    if (this._return_fun) {
      const returnRegex = new RegExp('^( *)return ', 'gu')
      let match3
      while ((match3 = returnRegex.exec(text)) !== null) {
        const identation = match3[1].length
        // Find previous function declaration on names
        const variableNames = Object.keys(this.names)
        for (let i = variableNames.length - 1; i >= 0; i--) {
          const variableName = variableNames[i]
          if (this.names[variableName].type === 'function' && this.names[variableName].defLine < lineNumber) {
            this.names[variableName].return = true
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
    // Busca referències a variables
    for (const variableName in this.names) {
      for (let j = 0; j < words.length; j++) {
        if (words[j].text !== variableName) continue

        const startChar = words[j].pos

        // Evita que es marqui com a referència a la mateixa línia de la definició
        if (this.names[variableName].defLine === lineNumber && this.names[variableName].defChar === startChar) continue

        if (enUnaLlista(words, j)) continue

        if (!this.names[variableName].outOfScope) {
          this.#tagIt(words[j], this.names[variableName], lineNumber, this.names[variableName].type, ['use'])
        }
      }
    }
  }

  getEntities() {
    return this.names
  }

  subtype(varname) {
    if (!this.names[varname]) return undefined
    return this.names[varname].subtype
  }

  get(name) {
    return this.names[name]
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
