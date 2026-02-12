import { HHError, HHErrorVal, HHErrorType, HHErrorArgument } from './errors.js'
import { hedyCommands } from './definitions/hedy-syntax.js'
import { validType } from './types.js'

export class HedyCommandAnalyzer {
  constructor(level, usesCometesText = false) {
    this.level = level
    this.commandsSyntax = new hedyCommands(level)
    this._usesCometesText = usesCometesText

    // Llista de textos de commandes que han de començar una línia (atBegining)
    this.cmdAtBegining = Object.values(this.commandsSyntax.commands)
      .filter(cmd => cmd.atBegining)
      .filter(cmd => (!cmd.levelStart || cmd.levelStart <= level) && (!cmd.levelEnd || cmd.levelEnd >= level))
      .map(cmd => cmd.text)
  }

  tagCommands(words) {
    // find print|ask|echo in words
    const positionPAE = words.findIndex(w => w.text === 'print' || w.text === 'ask' || w.text === 'echo')

    for (let k = 0; k < words.length; k++) {
      for (const command of this.commandsSyntax.getAll()) {
        let contextValid = true

        // Després de print, ask o echo tot és string i no comandes (exeptuant at random n3)
        if (
          !this._usesCometesText &&
          positionPAE != -1 &&
          positionPAE < k &&
          !(
            (words[k].text === 'at' && words[k + 1].text === 'random') || // TODO: Això s'hauria de fer millor
            (words[k].text === 'random' && k > 0 && words[k - 1].text === 'at')
          )
        )
          continue

        if (words[k].text !== command.text) {
          if (command.levelStart && command.levelStart > this.level) continue
          if (command.levelEnd && command.levelEnd < this.level) continue

          if (words[k].text.toLowerCase() === command.text) {
            words[k].couldBe = {
              command: command.name,
              errorCode: 'hy-to-lowercase-command',
            }
          }
          continue
        }

        if (command.levelStart && command.levelStart > this.level) {
          if (command.unavailable) {
            words[k].tag = command.unavailable
            words[k].type = command.unavailable.split('_')[0]
            continue
          }
          words[k].couldBe = {
            command: command.name,
            errorCode: 'hy-level-unavailable-yet',
          }
          continue
        } else if (command.levelEnd && command.levelEnd < this.level) {
          if (command.unavailable) {
            words[k].tag = command.unavailable
            words[k].type = command.unavailable.split('_')[0]
            continue
          }
          words[k].couldBe = {
            command: command.name,
            errorCode: 'hy-level-unavailable-deprecated',
          }
          continue
        }

        if (command.atBegining && k !== 0) {
          words[k].couldBe = {
            command: command.name,
            errorCode: 'hy-at-begining',
          }
          continue
        }

        if (command.parenthesis && (words.length <= k + 1 || words[k + 1].text !== '(')) {
          const pConfig = command.parenthesisConfig || 'required'
          if (pConfig === 'required') {
            words[k].couldBe = {
              command: command.name,
              errorCode: 'hy-command-parenthesis-missing',
            }
            continue
          }
          // optional/recommended: encara es taga com a comanda, es validarà a checkCommand
        }

        if (command.hasBefore) {
          const before = words
            .slice(0, k)
            .map(w => w.text)
            .join(' ')
          contextValid &&= before.match(command.hasBefore)
        }

        if (command.hasAfter) {
          const after = words
            .slice(k + 1)
            .map(w => w.text)
            .join(' ')
          contextValid &&= after.match(command.hasAfter)
        }

        if (contextValid) {
          words[k].type = 'command'
          words[k].tag = 'command_' + command.name
          words[k].command = command.name
          words[k].couldBe = undefined
          break
        } else {
          words[k].couldBe = {
            command: command.name,
            errorCode: 'hy-command-context',
          }
        }
      }
    }

    return words
  }

  checkCommandArguments(sintagma, commandWord, commandDef, commandPosSig, startCh, endCh, lineNumber) {
    let errorsFound = []
    let startArgsPos = startCh

    // === STEP 1: Determina el final efectiu dels arguments considerant concatOn ===
    // Si una comanda de concatenació (concatOn) apareix, els arguments d'aquesta comanda acaben allà.
    // Exemple: 1 + 2 + 3 → el primer '+' té arguments fins al segon '+'
    let effectiveEndCh = endCh
    if (commandDef.concatOn) {
      for (let j = startCh; j < endCh; j++) {
        const word = sintagma.get(j)
        if (word.command && commandDef.concatOn.includes(word.command)) {
          effectiveEndCh = j
          break
        }
      }
    }

    // === STEP 2: Classifica elements en arguments i separadors ===
    // Dins la zona d'arguments [startCh, effectiveEndCh), separa els separadors (comes, etc.)
    // dels arguments reals. Això permet comptar arguments sense comptar separadors.
    const elements = [] // { pos: number, isSeparator: boolean }
    for (let j = startCh; j < effectiveEndCh; j++) {
      const word = sintagma.get(j)
      const isSep = !!(commandDef.separator && word.command && word.command === commandDef.separator)
      elements.push({ pos: j, isSeparator: isSep })
    }

    const argPositions = elements.filter(e => !e.isSeparator).map(e => e.pos)
    const sepPositions = elements.filter(e => e.isSeparator).map(e => e.pos)
    const argCount = argPositions.length

    // === STEP 3: Valida l'estructura dels separadors ===
    // Comprova el patró: ARG [SEP ARG [SEP ARG ...]]
    // No pot haver-hi separador al final, ni dos separadors seguits.
    // Si és required/recommended, dóna error/warning si falta separador entre arguments.
    if (commandDef.separator && elements.length > 0) {
      const sepConfig = commandDef.separatorConfig || 'required'

      // No hi pot haver un separador al final
      if (elements[elements.length - 1].isSeparator) {
        const lastSepPos = elements[elements.length - 1].pos
        errorsFound.push(
          new HHError(
            sintagma.get(lastSepPos).text,
            'hy-not-expecting-coma-final',
            sintagma.start(lastSepPos),
            sintagma.end(lastSepPos),
            lineNumber,
          ),
        )
      }

      // Si és required o recommended, comprova que hi ha separador entre arguments adjacents
      if (sepConfig === 'required' || sepConfig === 'recommended') {
        for (let i = 1; i < elements.length; i++) {
          if (!elements[i].isSeparator && !elements[i - 1].isSeparator) {
            const errorCode = sepConfig === 'required' ? 'hy-separator-required' : 'hy-separator-recommended'
            errorsFound.push(
              new HHError(
                sintagma.get(elements[i].pos).text,
                errorCode,
                sintagma.end(elements[i].pos - 1),
                sintagma.start(elements[i].pos),
                lineNumber,
              ),
            )
          }
        }
      }

      // Marca separadors com a utilitzats
      for (const sepPos of sepPositions) {
        sintagma.markUsed(sepPos)
      }
    }

    // === STEP 4: Valida el nombre d'arguments (exclou separadors del recompte) ===
    if (commandDef.argumentsAfter !== undefined || commandDef.minArgumentsAfter !== undefined) {
      let argumentsAfter =
        commandDef.argumentsAfter === undefined
          ? [0]
          : Array.isArray(commandDef.argumentsAfter)
            ? commandDef.argumentsAfter
            : [commandDef.argumentsAfter]

      let argsMin = Math.min(...argumentsAfter)
      let argsMax = Math.max(...argumentsAfter)

      if (commandDef.minArgumentsAfter !== undefined) {
        argsMin = commandDef.minArgumentsAfter
        argsMax = Infinity
      }

      // Massa pocs arguments
      if (argCount < argsMin) {
        errorsFound.push(
          new HHErrorVal(
            commandWord.text,
            'hy-command-missing-argument',
            commandWord.pos,
            commandWord.pos + commandWord.text.length,
            lineNumber,
            argsMin,
          ),
        )
      }

      // Massa arguments (només quan hi ha un màxim definit)
      if (argsMax !== Infinity && argCount > argsMax) {
        for (let i = argsMax; i < argPositions.length; i++) {
          const j = argPositions[i]
          errorsFound.push(
            new HHErrorVal(
              commandWord.text,
              'hy-command-unexpected-argument',
              sintagma.start(j),
              sintagma.end(j),
              lineNumber,
              argsMax,
            ),
          )
        }
      }
    }

    // === STEP 5: Comprova els arguments abans de la comanda ===
    if (commandDef.argumentsBefore !== undefined) {
      if (commandPosSig < commandDef.argumentsBefore) {
        errorsFound.push(
          new HHErrorVal(
            commandWord.text,
            'hy-command-missing-argument-before',
            commandWord.start,
            commandWord.end,
            lineNumber,
            commandDef.argumentsBefore,
          ),
        )
      } else {
        startArgsPos = commandPosSig - commandDef.argumentsBefore
      }
    }

    // === STEP 6: Marca arguments vàlids com a utilitzats ===
    // Arguments abans de la comanda
    for (let j = startArgsPos; j < commandPosSig; j++) {
      sintagma.markUsed(j)
    }

    // Arguments després de la comanda (sense separadors, només els vàlids)
    let maxToMark = argPositions.length
    if (commandDef.argumentsAfter !== undefined && commandDef.minArgumentsAfter === undefined) {
      const argsMax = Math.max(
        ...(Array.isArray(commandDef.argumentsAfter) ? commandDef.argumentsAfter : [commandDef.argumentsAfter]),
      )
      maxToMark = Math.min(argPositions.length, argsMax)
    }
    for (let i = 0; i < maxToMark; i++) {
      sintagma.markUsed(argPositions[i])
    }

    // === STEP 7: Valida el tipus dels arguments ===
    if (commandDef.arguments) {
      for (let sx = 0; sx < commandDef.arguments.length; sx++) {
        const rule = commandDef.arguments[sx]
        if (rule.levelStart && rule.levelStart > this.level) continue
        if (rule.levelEnd && rule.levelEnd < this.level) continue

        // Arguments abans de la comanda
        for (let j = startArgsPos; j < commandPosSig; j++) {
          const arg = sintagma.get(j)
          const sstart = sintagma.start(j)
          const send = sintagma.end(j)

          if (rule.positionInSintagma !== undefined && rule.positionInSintagma !== commandPosSig) continue
          if (rule.refused && !validType(arg.tag, rule.refused)) continue
          if (rule.allowed && validType(arg.tag, rule.allowed)) continue

          const type = arg.couldBe ? 'command_' + arg.couldBe.command : arg.tag
          errorsFound.push(
            new HHErrorArgument(arg.text, rule.codeerror, sstart, send, lineNumber, type, commandWord.command),
          )
        }

        // Arguments després de la comanda (sense separadors)
        for (let i = 0; i < argPositions.length; i++) {
          const j = argPositions[i]
          const arg = sintagma.get(j)
          const sstart = sintagma.start(j)
          const send = sintagma.end(j)

          if (rule.positionInSintagma !== undefined && rule.positionInSintagma !== commandPosSig) continue
          if (rule.position !== undefined && rule.position !== i + 1) continue
          if (rule.refused && !validType(arg.tag, rule.refused)) continue
          if (rule.allowed && validType(arg.tag, rule.allowed)) continue

          const type = arg.couldBe ? 'command_' + arg.couldBe.command : arg.tag
          errorsFound.push(
            new HHErrorArgument(arg.text, rule.codeerror, sstart, send, lineNumber, type, commandWord.command),
          )
        }
      }
    }

    return errorsFound
  }

  checkCommand(sintagma, pos, lineNumber) {
    let errorsFound = []
    const commandWord = sintagma.get(pos)
    const commandDef = this.commandsSyntax.getByName(commandWord.command)

    if (!commandDef) return

    let endPos = sintagma.size() // Fi dels arguments
    let startPos = pos + 1 // Inici dels arguments

    // Es comprova si la comanda obre amb parenthesis
    let hasParenthesis = false
    if (commandDef.parenthesis) {
      const pConfig = commandDef.parenthesisConfig || 'required'
      hasParenthesis = sintagma.size() > pos + 1 && sintagma.get(pos + 1).command === 'parenthesis_open'

      if (hasParenthesis) {
        sintagma.markUsed(pos + 1)
        startPos = pos + 2 // Arguments start after the opening parenthesis
      } else if (pConfig === 'required') {
        errorsFound.push(
          new HHError(
            commandWord.text,
            'hy-command-parenthesis-missing',
            commandWord.pos,
            commandWord.pos + commandWord.text.length,
            lineNumber,
          ),
        )
        return errorsFound
      } else if (pConfig === 'recommended') {
        errorsFound.push(
          new HHError(
            commandWord.text,
            'hy-command-parenthesis-recommended',
            commandWord.pos,
            commandWord.pos + commandWord.text.length,
            lineNumber,
          ),
        )
        // Continua sense parèntesis, arguments comencen a pos + 1
      }
      // optional: no error, arguments comencen a pos + 1

      // Si no s'ha trobat '(' però hi ha un ')' al final, consumir-lo
      // per evitar errors espuris (hy-unnecessary-parentheses, hy-separator-recommended)
      if (!hasParenthesis && sintagma.last().command === commandDef.closedBy) {
        sintagma.markUsed(endPos - 1)
        endPos = endPos - 1
      }
    }

    // Es comprova si la comanda tanca amb closedBy
    // Si closedBy ve de parenthesis (auto-assignat), només comprova quan s'han trobat parèntesis
    const shouldCheckClosedBy = commandDef.closedBy && (!commandDef.parenthesis || hasParenthesis)
    if (shouldCheckClosedBy) {
      if (sintagma.last().command !== commandDef.closedBy) {
        errorsFound.push(
          new HHErrorType(
            commandWord.text,
            'hy-expecting-close',
            sintagma.sintagmaEnd(),
            sintagma.sintagmaEnd() + 1,
            lineNumber,
            'command_' + commandDef.closedBy,
          ),
        )
      } else {
        sintagma.markUsed(endPos - 1)
        endPos = endPos - 1
      }
    }

    // Es comprova si la definició necessita parèntesis per als paràmetres (e.g., def func(params):)
    if (commandDef.defParenthesis) {
      const funcNamePos = startPos
      if (
        funcNamePos < endPos &&
        sintagma.get(funcNamePos).tag &&
        sintagma.get(funcNamePos).tag.startsWith('entity_function')
      ) {
        const parenPos = funcNamePos + 1
        const hasDefParens = parenPos < endPos && sintagma.get(parenPos).command === 'parenthesis_open'

        if (hasDefParens) {
          // Busca el parèntesi tancat
          let closeParen = -1
          for (let j = parenPos + 1; j < endPos; j++) {
            if (sintagma.get(j).command === 'parenthesis_close') {
              closeParen = j
              break
            }
          }

          if (closeParen === -1) {
            errorsFound.push(
              new HHError(
                sintagma.get(funcNamePos).text,
                'hy-function-parenthesis-close',
                sintagma.end(endPos - 1),
                sintagma.end(endPos - 1) + 1,
                lineNumber,
              ),
            )
          }
        } else {
          // Falten parèntesis després del nom de la funció
          errorsFound.push(
            new HHError(
              sintagma.get(funcNamePos).text,
              'hy-function-parenthesis-missing',
              sintagma.start(funcNamePos),
              sintagma.end(funcNamePos),
              lineNumber,
            ),
          )
        }
      }
    }

    const argErrors = this.checkCommandArguments(sintagma, commandWord, commandDef, pos, startPos, endPos, lineNumber)
    errorsFound = errorsFound.concat(argErrors)
    return errorsFound
  }
}
