import { HHError, HHErrorVal, HHErrorType, HHErrorArgument } from './errors.js'
import { hedyCommands } from './definitions/hedy-syntax.js'
import { validType } from './types.js'

export class HedyCommandAnalyzer {
  constructor(level, usesCometesText = false) {
    this.level = level
    this.commandsSyntax = new hedyCommands(level)
    this._usesCometesText = usesCometesText
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
          words[k].couldBe = {
            command: command.name,
            errorCode: 'hy-level-unavailable-yet',
          }
          continue
        } else if (command.levelEnd && command.levelEnd < this.level) {
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
          words[k].couldBe = {
            command: command.name,
            errorCode: 'hy-command-parenthesis-missing',
          }
          continue
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

  checkCommandArguments(
    sintagma,
    commandWord,
    commandDef,
    commandPosSig,
    startCh,
    endCh,
    lineNumber,
    byconcat = false,
  ) {
    // DEBUG
    let errorsFound = []
    let endArgsPos = endCh
    let startArgsPos = startCh

    // S'han de comprovar els arguments després de la comanda
    if (commandDef.argumentsAfter !== undefined || commandDef.minArgumentsAfter !== undefined) {
      let endArgsMin = startCh
      let endArgsMax = startCh

      let argumentsAfter =
        commandDef.argumentsAfter === undefined
          ? [0]
          : Array.isArray(commandDef.argumentsAfter)
            ? commandDef.argumentsAfter
            : [commandDef.argumentsAfter]

      let argsMin = Math.min(...argumentsAfter)
      let argsMax = Math.max(...argumentsAfter)
      endArgsMin = startCh + argsMin
      endArgsMax = startCh + argsMax

      if (commandDef.minArgumentsAfter !== undefined) {
        endArgsMin = startCh + commandDef.minArgumentsAfter
        endArgsMax = sintagma.size() // Trick to avoid for loop unexpected-argument
        argsMin = commandDef.minArgumentsAfter
      }

      endArgsPos = endArgsMax

      if (!byconcat && endCh < endArgsMin) {
        // Només comprovem quan no és una concatenació
        errorsFound.push(
          new HHErrorVal(
            commandWord.text,
            'hy-command-missing-argument',
            commandWord.pos,
            commandWord.pos + commandWord.text.length,
            lineNumber,
            argsMin, // nombre mínim d'arguments
          ),
        )
      }

      // Qualsevol element després dels necessaris són erronis
      for (let j = endArgsPos; j < endCh; j++) {
        // per debugar
        const wordj = sintagma.get(j)
        // Exceptuant l'element de concatOn
        if (commandDef.concatOn && sintagma.get(j).command && sintagma.get(j).command.includes(commandDef.concatOn)) {
          errorsFound = errorsFound.concat(
            this.checkCommandArguments(
              sintagma,
              commandWord,
              commandDef,
              commandPosSig,
              j + 1,
              endCh,
              lineNumber,
              true,
            ),
          )
          break
        } else
          errorsFound.push(
            new HHErrorVal(
              commandWord.text,
              'hy-command-unexpected-argument',
              sintagma.start(j),
              sintagma.end(j),
              lineNumber,
              argsMax, // nombre màxim d'arguments
            ),
          )
      }
    }

    // S'han de comprovar els arguments abans de la comanda, només si no és per concatOn
    if (!byconcat && commandDef.argumentsBefore !== undefined) {
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

    // Marca com a utilitzats els arguments vàlids
    for (let j = startArgsPos; j < endArgsPos && j < endCh; j++) {
      sintagma.markUsed(j)
    }

    if (commandDef.arguments) {
      for (let sx = 0; sx < commandDef.arguments.length; sx++) {
        const rule = commandDef.arguments[sx]
        if (rule.levelStart && rule.levelStart > this.level) continue
        if (rule.levelEnd && rule.levelEnd < this.level) continue

        for (let j = startArgsPos; j < endArgsPos && j < sintagma.size(); j++) {
          if (j == commandPosSig) continue // No comprova la commanda en sí mateixa

          const arg = sintagma.get(j)
          const sstart = sintagma.start(j)
          const send = sintagma.end(j)

          if (
            commandDef.concatOn &&
            (j === 0 || !sintagma.get(j - 1).command) && // Can concat a command
            sintagma.get(j).command &&
            commandDef.concatOn.includes(sintagma.get(j).command)
          )
            break // Stop checking if it's a concatOn command

          if (rule.positionInSintagma !== undefined && rule.positionInSintagma !== commandPosSig) continue
          if (rule.position !== undefined && rule.position !== j - startArgsPos + 1) continue
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
    if (commandDef.parenthesis) {
      if (sintagma.size() <= pos + 1 || sintagma.get(pos + 1).command !== 'parenthesis_open') {
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
      }

      sintagma.markUsed(pos + 1)
      startPos = pos + 2 // Arguments start after the opening parenthesis
    }

    // Es comprova si la comanda tanca amb closedBy (si hi ha parentesis ja s'ha assignat amb 'parenthesis_close')
    if (commandDef.closedBy) {
      if (sintagma.last().command !== commandDef.closedBy) {
        errorsFound.push(
          new HHErrorType(
            commandWord.text,
            'hy-expecting-close',
            sintagma.sintagmaEnd() - 1,
            sintagma.sintagmaEnd(),
            lineNumber,
            'command_' + commandDef.closedBy,
          ),
        )
      } else {
        sintagma.markUsed(endPos - 1)
      }

      endPos = endPos - 1
    }

    const argErrors = this.checkCommandArguments(sintagma, commandWord, commandDef, pos, startPos, endPos, lineNumber)
    errorsFound = errorsFound.concat(argErrors)
    return errorsFound
  }
}
