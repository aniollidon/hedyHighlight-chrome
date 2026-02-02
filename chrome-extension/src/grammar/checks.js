import { identation, separarParaules, compare } from '../utils.js'
import { EntityDefinitions } from './entities.js'
import { Memory } from './memory.js'
import { hedyCommands, specificHedyErrors, hedyGeneralSyntax, errorMapping } from './definitions/hedy-syntax.js'
import { HHError, HHErrorVal, HHErrorVals, HHErrorType, HHErrorLineDef } from './errors.js'
import { detectMorpho } from './morphosyntax.js'
import { validType, compareTypes, detectTypeConstant } from './types.js'
import * as def from './definitions/definitions.js'
import { HedyCommandAnalyzer } from './command-analyzer.js'

const condicionalInlineRegex =
  /^(if +([\p{L}_\d]+) *( is | in |=|==|<|>|!=|<=|>=| not +in ) *(".*"|[\p{L}_\d]+) *:? |else )+(.*)$/u
const condicionalElseInlineRegex = /(.* )(else) (.*)/
const bucleInlineRegex = /^(repeat +([\p{L}_\d]+) +times +)(.*)$/u

class CheckHedy {
  constructor(level) {
    this.memory = new Memory(level)
    this.entities = new EntityDefinitions(level)
    this._usesCometesText = def.COMETES_TEXTOS.at(level)
    this.commandsSyntax = new HedyCommandAnalyzer(level, this._usesCometesText)
    this.level = level
    this._defineVarOp = def.CMD_EQUAL.at(level) ? 'is|=' : 'is'
    this._conditionalInline = def.CONDITIONAL_INLINE.start <= level // No es mira quan acaba ja que ens interessa trobar-los per mostrar errors
    this._bucleInline = def.LOOP_INLINE.start <= level // Idem anterior
    this._usesScope = def.USES_SCOPE.at(level)
    this._scopeRecursive = def.SCOPE_RECURSIVE.at(level)
    this._usesCometesArreu = def.COMETES_ARREU.at(level)
    this._decimals = def.DECIMALS.at(level)
    this._atrandom = def.CMD_ATRANDOM.at(level)
    this._booleans = def.BOOLEANS.at(level)
    this._range = def.CMD_RANGETO.at(level)
    this._functions = def.FUNCIONS.at(level)
    let beforeDef = '^'
    if (this._bucleInline) beforeDef = '(?:^|\\btimes\\b)'

    this._declarationRegex = new RegExp(`${beforeDef} *\\b([\\p{L}_\\d]+)\\s*( ${this._defineVarOp})`, 'u') // Regex per trobar `var is|=`
  }

  analyse(line, lineNumber) {
    const identationLength = identation(line)
    const lineTrim = line.trim()
    if (lineTrim === '') return []
    const errors = this._analysePhrase(lineTrim, identationLength, lineNumber)
    return this._processErrors(errors, line, lineNumber)
  }
  _analysePhrase(lineTrim, identationLength, lineNumber) {
    // TODO: DEPRECAR I MILLORAR IMPLEMENTACIÓ, SEPARAR PER COMANDES AT BEGINING?
    let errorsFound = []
    // mira si es un bucle inline
    const bucle = this._bucleInline ? bucleInlineRegex.exec(lineTrim) : null

    // Mira si és un condicional
    const condicional = this._conditionalInline ? condicionalInlineRegex.exec(lineTrim) : null

    // Mira si és un else inline
    const elseInline = this._conditionalInline ? condicionalElseInlineRegex.exec(lineTrim) : null

    if (bucle !== null) {
      const bucledef = bucle[1]
      const action = bucle[3]

      let res = this._analyseSintagma(bucledef, identationLength, lineNumber)
      errorsFound = errorsFound.concat(res)

      const innerIdentation = identation(action)
      res = this._analysePhrase(action.trim(), innerIdentation + identationLength + bucledef.length, lineNumber)
      errorsFound = errorsFound.concat(res)
    } else if (condicional !== null) {
      const condition = condicional[1]
      const action = condicional[5]

      let res = this._analyseSintagma(condition, identationLength, lineNumber)
      errorsFound = errorsFound.concat(res)

      const innerIdentation = identation(action)
      res = this._analysePhrase(action.trim(), innerIdentation + identationLength + condition.length, lineNumber)
      errorsFound = errorsFound.concat(res)
    } else if (elseInline !== null) {
      const actionif = elseInline[1]
      const elseword = elseInline[2]
      const actionelse = elseInline[3]

      let res = this._analysePhrase(actionif, identationLength, lineNumber)
      errorsFound = errorsFound.concat(res)

      res = this._analyseSintagma(elseword, identationLength + actionif.length, lineNumber)
      errorsFound = errorsFound.concat(res)

      const innerIdentation = identation(actionelse)
      res = this._analysePhrase(
        actionelse.trim(),
        innerIdentation + identationLength + actionif.length + elseword.length,
        lineNumber,
      )
      errorsFound = errorsFound.concat(res)
    } else {
      return this._analyseSintagma(lineTrim, identationLength, lineNumber)
    }

    return errorsFound
  }

  __analysePhrase(lineTrim, identationLength, lineNumber) {
    // TODO: DEPRECAR I MILLORAR IMPLEMENTACIÓ, SEPARAR PER COMANDES AT BEGINING?
    let errorsFound = []
    // mira si es un bucle inline
    const bucle = this._bucleInline ? bucleInlineRegex.exec(lineTrim) : null

    // Mira si és un condicional
    const condicional = this._conditionalInline ? condicionalInlineRegex.exec(lineTrim) : null

    // Mira si és un else inline
    const elseInline = this._conditionalInline ? condicionalElseInlineRegex.exec(lineTrim) : null

    if (bucle !== null) {
      const bucledef = bucle[1]
      const action = bucle[3]

      let res = this._analyseSintagma(bucledef, identationLength, lineNumber)
      errorsFound = errorsFound.concat(res)

      const innerIdentation = identation(action)
      res = this._analysePhrase(action.trim(), innerIdentation + identationLength + bucledef.length, lineNumber)
      errorsFound = errorsFound.concat(res)
    } else if (condicional !== null) {
      const condition = condicional[1]
      const action = condicional[5]

      let res = this._analyseSintagma(condition, identationLength, lineNumber)
      errorsFound = errorsFound.concat(res)

      const innerIdentation = identation(action)
      res = this._analysePhrase(action.trim(), innerIdentation + identationLength + condition.length, lineNumber)
      errorsFound = errorsFound.concat(res)
    } else if (elseInline !== null) {
      const actionif = elseInline[1]
      const elseword = elseInline[2]
      const actionelse = elseInline[3]

      let res = this._analysePhrase(actionif, identationLength, lineNumber)
      errorsFound = errorsFound.concat(res)

      res = this._analyseSintagma(elseword, identationLength + actionif.length, lineNumber)
      errorsFound = errorsFound.concat(res)

      const innerIdentation = identation(actionelse)
      res = this._analysePhrase(
        actionelse.trim(),
        innerIdentation + identationLength + actionif.length + elseword.length,
        lineNumber,
      )
      errorsFound = errorsFound.concat(res)
    } else {
      return this._analyseSintagma(lineTrim, identationLength, lineNumber)
    }

    return errorsFound
  }

  _analyseSintagma(lineTrim, identationLength, lineNumber) {
    let words = separarParaules(lineTrim)
    const errorsFound = []

    // Skip empty lines
    if (words.length === 0) return []

    // Comprova identació.
    if (this._usesScope) {
      const scopeCheck = this.memory.comprovaScope(identationLength)
      if (scopeCheck === 'missaligned') {
        errorsFound.push(
          new HHErrorVals('identation', 'hy-identation-misalignment', 0, identationLength, lineNumber, {
            EXPECTED: this.memory.getDefinedIdentation(),
            FOUND: identationLength,
          }),
        )
      } else if (scopeCheck === 'not_expected') {
        errorsFound.push(new HHError('identation', 'hy-identation-not-expected', 0, identationLength, lineNumber))
      } else if (scopeCheck === 'large') {
        errorsFound.push(
          new HHErrorVals('identation', 'hy-identation-large', 0, identationLength, lineNumber, {
            EXPECTED: this.memory.getDefinedIdentation(),
          }),
        )
      } else if (scopeCheck === 'small') {
        errorsFound.push(
          new HHErrorVals('identation', 'hy-identation-small', 0, identationLength, lineNumber, {
            EXPECTED: this.memory.getDefinedIdentation(),
          }),
        )
      } else if (scopeCheck === 'expected') {
        errorsFound.push(
          new HHErrorVals('identation', 'hy-identation-expected', 0, identationLength, lineNumber, {
            EXPECTED: this.memory.getDefinedIdentation(),
          }),
        )
      } else if (!this._scopeRecursive && this.memory.isScopeRecursive(identationLength)) {
        errorsFound.push(
          new HHError('identation', 'hy-identation-multiple-unavailable', 0, identationLength, lineNumber),
        )
      }
    }

    const wordsTagged = this._tagWordsAndMorpho(words, identationLength, lineNumber, lineTrim)
    const sintagma = this.memory.newSintagma(wordsTagged, identationLength, lineNumber)

    let errors = this._searchMorphosyntacticErrors(sintagma, lineNumber)
    if (errors.length > 0) errorsFound.push(...errors)

    errors = this._searchSpecificErrors(sintagma, lineNumber)
    if (errors.length > 0) errorsFound.push(...errors)

    errors = this._searchNotUsed(sintagma, lineNumber)
    if (errors.length > 0) errorsFound.push(...errors)

    console.log('línia ' + (lineNumber + 1) + ':', sintagma)

    return errorsFound
  }

  _tagWordsAndMorpho(words, identationLength, lineNumber, rawLine) {
    // suma la identació a la posició de les paraules
    for (let i = 0; i < words.length; i++) {
      words[i].pos += identationLength
    }

    if (words.length === 0) return []

    words = this.commandsSyntax.tagCommands(words)
    this.entities.analizeLine(words, lineNumber, identationLength)

    // Tagging entities and constants
    for (let i = 0; i < words.length; i++) {
      const text = words[i].text
      if (text === '') continue
      const entity = this.entities.getEntity(lineNumber, words[i].pos)

      if (
        words[i].type === 'command' &&
        entity !== undefined &&
        entity.defLine == lineNumber &&
        words[i].command !== 'print'
      ) {
        words[i].type = 'entity_' + entity.type
        words[i].tag =
          'entity_' + entity.type + '_' + (entity.return ? 'return_' : '') + (entity.subtype ? entity.subtype : 'mixed')
        words[i].entity = entity
        words[i].couldBe = {
          command: words[i].command,
        }
        words[i].command = undefined
      } else if (words[i].type !== 'command') {
        const constant = detectTypeConstant(text, true, this._booleans, this._usesCometesText)

        if (entity !== undefined) {
          words[i].type = 'entity_' + entity.type
          words[i].tag =
            'entity_' +
            entity.type +
            '_' +
            (entity.return ? 'return_' : '') +
            (entity.subtype ? entity.subtype : 'mixed')
          words[i].entity = entity
        } else if (constant !== undefined) {
          words[i].type = 'constant'
          words[i].tag = 'constant_' + constant
          words[i].constant = constant
        }
      }
    }

    // Processa la frase per trobar operacions
    words = detectMorpho(words, this._atrandom, this._functions, this._range, rawLine)

    return words
  }

  _searchMorphosyntacticErrors(sintagma, lineNumber) {
    const errorsFound = []

    for (let k = 0; k < sintagma.size(); k++) {
      const word = sintagma.get(k)

      if (word.subphrase) {
        errorsFound.push(...this._searchMorphosyntacticErrors(word.subphrase, lineNumber))
      }

      let start = sintagma.start(k)
      let end = sintagma.end(k)

      if (word.couldBe && word.tag.startsWith('entity')) {
        errorsFound.push(new HHError(word.text, 'hy-command-entity-conflict', start, end, lineNumber))
      }
      if (word.couldBe && !word.tag.startsWith('entity')) {
        errorsFound.push(new HHError(word.text, word.couldBe.errorCode, start, end, lineNumber))
        continue
      }

      if (word.command) {
        const commandErrors = this.commandsSyntax.checkCommand(sintagma, k, lineNumber)
        errorsFound.push(...commandErrors)
      }

      if (word.entity) {
        if (word.entity.outOfScope) {
          errorsFound.push(
            new HHErrorLineDef(word.text, 'hy-entity-out-of-scope', start, end, lineNumber, word.entity.defLine),
          )
          continue
        }

        for (let ch of word.entity.changes) {
          if (
            ch.line === sintagma.linenum &&
            ch.char === word.pos &&
            ch.oldSubtype !== ch.newSubtype &&
            !ch.oldSubtype.includes('mixed') &&
            !ch.newSubtype.includes('mixed')
          ) {
            errorsFound.push(
              new HHErrorLineDef(
                word.text,
                'hy-entity-changes-content-type',
                start,
                sintagma.sintagmaEnd(),
                lineNumber,
                word.entity.defLine,
              ),
            )
          }
        }
      }

      for (let i = 0; i < hedyGeneralSyntax.length; i++) {
        const rule = hedyGeneralSyntax[i]
        if (rule.levelStart && rule.levelStart > this.level) continue
        if (rule.levelEnd && rule.levelEnd < this.level) continue
        if (rule.positionInSintagma !== undefined && rule.positionInSintagma !== k) continue
        if (rule.subpartial !== undefined && !compare(rule.subpartial, sintagma.partialnum)) continue
        if (rule.subphrase !== undefined && !compare(rule.subphrase, sintagma.subsintagmanum)) continue
        if (rule.refused && !validType(word.tag, rule.refused)) continue
        if (rule.identationFound !== undefined && rule.identationFound === true && sintagma.identation === 0) continue
        if (rule.identationFound !== undefined && rule.identationFound === false && sintagma.identation > 0) {
          continue
        }
        if (rule.parentTag && (!sintagma.parentTag || !sintagma.parentTag.startsWith(rule.parentTag))) continue

        if (rule.allowed && validType(word.tag, rule.allowed)) {
          sintagma.markUsed(k)
          continue
        }

        if (rule.highlight === 'line') {
          start = sintagma.sintagmaStart()
          end = sintagma.sintagmaEnd()
        } else if (rule.highlight === 'identation') {
          start = sintagma.sintagmaStart() - sintagma.identation
          end = sintagma.sintagmaStart()
        } else if (rule.highlight === 'previous-char') {
          start = sintagma.start(k) === 0 ? 0 : sintagma.start(k) - 1
          end = sintagma.start(k)
        }

        errorsFound.push(new HHErrorType(word.text, rule.codeerror, start, end, lineNumber, word.tag))
      }
    }

    return errorsFound
  }

  _searchSpecificErrors(sintagma, lineNumber) {
    const errorsFound = []

    for (let k = 0; k < sintagma.size(); k++) {
      const word = sintagma.get(k)

      if (word.subphrase) {
        errorsFound.push(...this._searchSpecificErrors(word.subphrase, lineNumber))
      }

      for (let j = 0; j < specificHedyErrors.length; j++) {
        const error = specificHedyErrors[j]

        if (error.levelStart && error.levelStart > this.level) continue
        if (error.levelEnd && error.levelEnd < this.level) continue

        if (error.commands) {
          let searchWhen = false
          let taggedCommand = undefined

          if (word.type && word.type.startsWith('command')) {
            searchWhen = 'valid'
            taggedCommand = word.command
          } else if (word.couldBe) {
            searchWhen = 'invalid'
            taggedCommand = word.couldBe.command
          } else continue

          if (error.whenCommand && error.whenCommand !== searchWhen) continue
          if (!error.commands.includes(taggedCommand)) continue
        } else if (error.tags) {
          if (!validType(word.tag, error.tags)) continue
        }

        let match = undefined

        if (error.match) {
          match = error.match.exec(word.text)
          if (!match) continue
        }
        if (error.hasAfter) {
          const after = sintagma.codeSince(k)
          match = after.match(error.hasAfter)
          if (!match) continue
        }
        if (error.hasBefore) {
          const before = sintagma.codeUntil(k)
          match = before.match(error.hasBefore)
          if (!match) continue
        }
        if (error.list || error.notlist) {
          const place = error.list ? error.list : error.notlist
          const si = place === 'before' ? k - 1 : k + 1
          if (si < 0 || si >= sintagma.size()) continue

          const found = sintagma.get(si).tag.startsWith('entity_variable_list')

          if (error.list && !found) continue
          if (error.notlist && found) continue
        }

        if (error.special_else && this.memory.cercaIf(this._usesScope, sintagma.identation)) continue

        if (error.beforeAndAfter && error.beforeAndAfter === 'same') {
          if (k === 0 || k + 1 >= sintagma.size()) continue
          if (sintagma.get(k - 1).text !== sintagma.get(k + 1).text) continue
        } else if (error.beforeAndAfter && error.beforeAndAfter === 'same-type') {
          if (k === 0 || k + 1 >= sintagma.size()) continue
          if (compareTypes(sintagma.get(k - 1).tag, sintagma.get(k + 1).tag)) continue
        } else if (error.beforeAndAfter && error.beforeAndAfter === 'same-constant-text') {
          if (k === 0 || k + 1 >= sintagma.size()) continue
          if (sintagma.get(k - 1).constant === undefined && sintagma.get(k + 1).constant === undefined) continue
          if (sintagma.get(k - 1).constant !== sintagma.get(k + 1).constant) continue
        }

        let start = sintagma.start(k)
        let end = sintagma.end(k)

        if (error.highlight === 'before_word') {
          if (k === 0) continue
          start = sintagma.start(k - 1)
          end = sintagma.end(k - 1)
        } else if (error.highlight === 'after_word') {
          if (k + 1 >= sintagma.size()) continue
          start = sintagma.start(k + 1)
          end = sintagma.end(k + 1)
        } else if (error.highlight === 'definition') {
          start = sintagma.sintagmaStart()
          end = sintagma.sintagmaEnd()
          for (let i = 0; i + 1 < sintagma.size(); i++) {
            if (sintagma.get(i).tag.startsWith('command_variable_define')) start = sintagma.start(i + 1)
          }
        } else if (error.highlight === 'before') {
          if (k === 0) continue
          start = sintagma.sintagmaStart()
          end = sintagma.end(k - 1)
        } else if (error.highlight === 'after') {
          if (k + 1 >= sintagma.size()) continue
          start = sintagma.start(k + 1)
          end = sintagma.sintagmaEnd()
        } else if (error.highlight === 'line') {
          start = sintagma.sintagmaStart()
          end = sintagma.sintagmaEnd()
        } else if (error.highlight === 'match_last') {
          if (!match) continue
          const found = sintagma.position_last(match[0])
          if (found === -1) continue
          start = sintagma.start(found)
          end = sintagma.end(found)
        }

        errorsFound.push(new HHError(word.text, error.codeerror, start, end, lineNumber))
      }
    }

    return errorsFound
  }

  _searchNotUsed(sintagma, lineNumber) {
    const errorsFound = []

    for (let k = 0; k < sintagma.size(); k++) {
      const word = sintagma.get(k)

      if (word.subphrase) {
        errorsFound.push(...this._searchNotUsed(word.subphrase, lineNumber))
      }

      // Busca paraules no utilitzades
      if (!word.used) {
        errorsFound.push(
          new HHErrorType(word.text, 'hy-type-context', sintagma.start(k), sintagma.end(k), lineNumber, word.tag),
        )
      }
    }

    return errorsFound
  }

  _processErrors(errors, line, lineNumber) {
    // Ajusta el mapeig d'errors
    for (let i = 0; i < errors.length; i++) {
      const error = errors[i]
      for (let j = 0; j < errorMapping.length; j++) {
        const mapping = errorMapping[j]
        if (mapping.codeerror === error.errorCode) {
          if (mapping.on && !mapping.on.includes(error.onText)) continue
          errors[i].set(mapping.to)
          break
        }
      }
    }

    // Processa els error i evita que es solapin, si dos errors coincideixen deixa el de més prioritat
    for (let i = 0; i < errors.length; i++) {
      const error = errors[i]
      for (let j = i + 1; j < errors.length; j++) {
        const error2 = errors[j]
        // Si interseccionen
        if (error.start < error2.end && error2.start < error.end) {
          // Manté el de més prioritat
          if (error.priority > error2.priority) {
            errors.splice(j, 1)
            j--
            //console.log('error eliminat a la línia ' + lineNumber + ':', error2, 'ja que intersecciona amb', error)
          } else {
            errors.splice(i, 1)
            i--
            //console.log('error eliminat a la línia ' + lineNumber + ':', error, 'ja que intersecciona amb', error2)
            break
          }
        }
      }
    }

    // Si dos errors són idèntics i consecutius seperats per només espais fusiona-ho
    for (let i = 0; i < errors.length - 1; i++) {
      const error = errors[i]
      const error2 = errors[i + 1]
      if (error.errorCode === error2.errorCode && error.getMessage() === error2.getMessage()) {
        const textBeween = line.substring(error.end, error2.start).trim()
        if (textBeween === '') {
          error.end = error2.end
          errors.splice(i + 1, 1)
          i--
        }
      }
    }

    return errors
  }

  finalCheck(lastLine) {
    let errors = []
    // Errors d'indentació al final del fitxer
    const err = this.memory.finalCheck()
    if (err === 'expected') {
      const last = this.memory.last()
      let pos = last ? last.sintagmaEnd() : 0

      if (last.linenum !== lastLine) pos = 0

      errors.push(new HHError('identation', 'hy-fileends-identation-expected', pos, pos + 1, lastLine))
    }
    // Errors d'entitats no utilitzades
    const unusedEntities = this.entities.finalCheck()
    for (let i = 0; i < unusedEntities.unUsed.length; i++) {
      const entity = unusedEntities.unUsed[i]
      errors.push(
        new HHErrorType(
          entity.name,
          'hy-entity-not-used',
          entity.defChar,
          entity.defChar + entity.name.length,
          entity.defLine,
          'entity_' + entity.type,
        ),
      )
    }
    return errors
  }
}

export { CheckHedy }
