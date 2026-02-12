import commands from './commands.js'
import specificHedyErrors from './specific-errors.js'
import { hedyGeneralSyntax } from './general-syntax.js'
import { errorMapping } from './error-mapping.js'

class Command {
  constructor(obj) {
    Object.assign(this, obj)
    this.isSymbol = this.text.match('^[a-z]') === null
    if (!this.rtext) this.rtext = this.text.replace(/[+*]/g, '\\$&')

    if (!this.isSymbol) this.rtext = `\\b${this.rtext}\\b`

    if (!this.arguments) this.arguments = []

    if (!this.name) this.name = this.text

    if (!this.parenthesis) this.parenthesis = false

    if (this.parenthesis) this.closedBy = this.closedBy || 'parenthesis_close'
  }
}

class hedyCommands {
  constructor(level) {
    this.level = level
    this.commands = {}

    for (let comm of commands) {
      if (comm.syntax) {
        for (const syntax of comm.syntax) {
          if (syntax.levelStart && level < syntax.levelStart) continue
          if (syntax.levelEnd && level > syntax.levelEnd) continue

          // Afegeix a la comanda qualsevol element de sintaxi (exeptuant levelStart i levelEnd)
          for (const key in syntax) {
            if (key !== 'levelStart' && key !== 'levelEnd') {
              comm[key] = syntax[key]
            }
          }
        }
      }
      const obj = new Command(comm)
      this.commands[obj.name] = obj
    }
  }

  getByName(name) {
    return this.commands[name]
  }

  getAll() {
    return Object.values(this.commands)
  }
}

export { hedyCommands, specificHedyErrors, hedyGeneralSyntax, errorMapping }
