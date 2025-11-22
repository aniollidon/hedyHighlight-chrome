import { varDefinitionType, enUnaLlista } from './types.js'
import { entreCometes } from '../utils.js'

export class EntityDefinitions {
    constructor(level) {
        this.entities = {}
        this.level = level
        this._defineVarOp = level >= 6 ? 'is|=' : 'is'
        this._usesScope = level >= 8
        this._scopeRecursive = level >= 9
        this._bucleInline = level == 7
        this._usesCometesArreu = level >= 12
        this._decimals = level >= 12
        this._atrandom = level >= 3 && level <= 15
        this._booleans = level >= 15
        this._range = level >= 11
        this._functions = level >= 12
        let beforeDef = '^'
        if (this._bucleInline) beforeDef = '(?:^|\\btimes\\b)'

        this._declarationRegex = new RegExp(`${beforeDef} *\\b([\\p{L}_\\d]+)\\s*( ${this._defineVarOp})`, 'u') // Regex per trobar `var is|=`
    }

    analizeLine(line, lineNumber) {
        const lineTrim = line.trim()
        if (lineTrim === '') return

        // Detecta definicions de variables
        const match = lineTrim.match(this._declarationRegex)
        if (match) {
            const varName = match[1]
            const define_var_operator = match[2]
            const hasQuotes = this._usesCometesArreu
            const hasBooleans = this._booleans
            const type = varDefinitionType(lineTrim, hasQuotes, hasBooleans, define_var_operator, this.entities)
            this.addEntity(varName, 'variable', lineNumber, type)
        }

        // Detecta definicions de funcions
        if (this._functions) {
            const matchFunction = lineTrim.match(/^define +([\p{L}_\d]+)/u)
            if (matchFunction) {
                const functionName = matchFunction[1]
                this.addEntity(functionName, 'function', lineNumber)

                // Detecta paràmetres
                const params = lineTrim.match(/with +([\p{L}_\d]+(?:, +[\p{L}_\d]+)*)/u)
                if (params) {
                    const paramsList = params[1].split(',')
                    paramsList.forEach(param => {
                        this.addEntity(param.trim(), 'parameter', lineNumber)
                    })
                }
            }
        }
    }

    addEntity(name, type, line, subtype = null) {
        this.entities[name] = { type, line, subtype }
    }

    getEntity(name) {
        return this.entities[name]
    }

    exists(name) {
        return this.entities[name] !== undefined
    }
}
