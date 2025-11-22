import commands from './commands.js'
import specificErrors from './specific-errors.js'
import generalSyntax from './general-syntax.js'
import errorMapping from './error-mapping.js'

export class hedyCommands {
    constructor(level) {
        this.level = level
        this.commands = commands.filter(c => {
            return (c.levelStart === undefined || c.levelStart <= level) && (c.levelEnd === undefined || c.levelEnd >= level)
        })
        this.specificErrors = specificErrors.filter(c => {
            return (c.levelStart === undefined || c.levelStart <= level) && (c.levelEnd === undefined || c.levelEnd >= level)
        })
        this.generalSyntax = generalSyntax.filter(c => {
            return (c.levelStart === undefined || c.levelStart <= level) && (c.levelEnd === undefined || c.levelEnd >= level)
        })
        this.errorMapping = errorMapping
    }

    getCommand(command) {
        return this.commands.find(c => c.text === command)
    }

    getCommandByName(name) {
        return this.commands.find(c => c.name === name)
    }

    getCommands() {
        return this.commands
    }

    getSpecificErrors() {
        return this.specificErrors
    }

    getGeneralSyntax() {
        return this.generalSyntax
    }

    getErrorMapping() {
        return this.errorMapping
    }
}
