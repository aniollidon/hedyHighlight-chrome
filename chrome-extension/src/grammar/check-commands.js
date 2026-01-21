import { HHError, HHErrorVal, HHErrorVals, HHErrorType, HHErrorLineDef } from './errors.js'

function checkCommandArguments(sintagma, commandWord, commandDef, commandPosSig, startCh, endCh, lineNumber) {
  let errorsFound = []
  let endArgsPos = endCh
  let startArgsPos = startCh

  // S'han de comprovar els arguments després de la comanda
  if (commandDef.argumentsAfter !== undefined || commandDef.minArgumentsAfter !== undefined) {
    let argumentsAfter = [0]

    if (Array.isArray(commandDef.argumentsAfter)) argumentsAfter = commandDef.argumentsAfter
    argumentsAfter = [commandDef.argumentsAfter]

    const argsMin = Math.min(...argumentsAfter)
    const argsMax = Math.max(...argumentsAfter)
    let endArgsMin = startCh + argsMin
    let endArgsMax = startCh + argsMax

    if (commandDef.minArgumentsAfter !== undefined) {
      endArgsMin = startCh + commandDef.minArgumentsAfter
      endArgsMax = sintagma.size() // Trick to avoid for loop unexpected-argument
    }

    endArgsPos = endArgsMax

    if (endCh < endArgsMin) {
      errorsFound.push(
        new HHErrorVal(
          commandWord.text,
          'hy-command-missing-argument',
          commandWord.start,
          commandWord.end,
          lineNumber,
          argsMin, // nombre mínim d'arguments
        ),
      )
    }

    // Qualsevol element després dels necessaris són erronis
    for (let j = endArgsPos + 1; j < endCh; j++) {
      // Exceptuant l'element de concatOn
      if (commandDef.concatOn && sintagma.get(j).command && sintagma.get(j).command.includes(commandDef.concatOn)) {
        errorsFound = errorsFound.concat(
          checkCommandArguments(sintagma, commandWord, commandDef, commandPosSig, startCh + 1, endCh, lineNumber),
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

  // S'han de comprovar els arguments abans de la comanda
  if (commandDef.argumentsBefore !== undefined) {
    if (startCh < commandDef.argumentsBefore) {
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
      startArgsPos = startCh - commandDef.argumentsBefore
    }
  }

  // Marca com a utilitzats els arguments vàlids
  for (let j = startArgsPos; j < endArgsPos + 1 && j < endCh; j++) {
    sintagma.markUsed(j)
  }

  if (commandDef.arguments) {
    for (let sx = 0; sx < commandDef.arguments.length; sx++) {
      const rule = commandDef.arguments[sx]
      if (rule.levelStart && rule.levelStart > this.level) continue
      if (rule.levelEnd && rule.levelEnd < this.level) continue

      for (let j = startArgsPos; j < endArgsPos + 1 && j < sintagma.size(); j++) {
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
        if (rule.position !== undefined && rule.position !== j - startArgsPos) continue
        if (rule.refused && !validType(arg.tag, rule.refused)) continue
        if (rule.allowed && validType(arg.tag, rule.allowed)) continue

        const type = arg.couldBe ? 'command_' + arg.couldBe.command : arg.tag
        errorsFound.push(new HHErrorType(word.text, rule.codeerror, sstart, send, lineNumber, type))
      }
    }
  }

  return errorsFound
}

export function checkCommand(sintagma, pos, lineNumber) {
  let errorsFound = []
  const commandWord = sintagma.get(pos)
  const commandDef = this.commandsSyntax.getByName(commandWord.command)

  if (!commandDef) return

  let endPos = sintagma.size()

  // Es comprova si la comanda tanca amb closedBy
  if (commandDef.closedBy) {
    if (sintagma.last().command !== commandDef.closedBy) {
      errorsFound.push(
        new HHErrorVal(
          commandWord.text,
          'hy-expecting-close',
          sintagma.sintagmaEnd() - 1,
          sintagma.sintagmaEnd(),
          lineNumber,
          commandDef.closedBy,
        ),
      )

      sintagma.markUsed(sintagma.size() - 1)
    }

    endPos = endPos - 1
  }

  const argErrors = checkCommandArguments(sintagma, commandWord, commandDef, pos, pos + 1, endPos, lineNumber)
  errorsFound = errorsFound.concat(argErrors)
  return errorsFound
}
