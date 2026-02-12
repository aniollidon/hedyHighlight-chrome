import lang from '../lang/lang.js'
import { cleanCometes } from '../utils.js'

export function detectTypeConstant(text, hasNumbers = true, hasBooleans = false, hasCometes = true) {
  const word = text.trim()

  if (hasBooleans && (word === 'true' || word === 'false' || word === 'True' || word === 'False')) return 'boolean'

  // Si és un número
  if (hasNumbers && !isNaN(word) && !word.startsWith('.')) {
    if (word.includes('.')) return 'number_decimal'
    else return 'number_integer'
  }

  const quoted =
    hasCometes && ((word.startsWith('"') && word.endsWith('"')) || (word.startsWith("'") && word.endsWith("'")))

  // Pot ser una nota musical
  if (cleanCometes(word).match(/^\b(?:C[0-9]|D[0-9]|E[0-9]|F[0-9]|G[0-9]|A[0-9]|B[0-9]|[A-G])\b$/))
    return quoted ? 'note_quoted' : 'note'

  // Pot ser un color
  if (word.match(/\b(blue|green|red|black|brown|gray|orange|pink|purple|white|yellow)\b/))
    return quoted ? 'color_quoted' : 'color'

  // Pot ser un color segons l'idioma
  if (lang.isColor(cleanCometes(word))) return quoted ? 'color_language_quoted' : 'color_language'

  if (quoted) return 'string_quoted'
  else if (word === '_') return 'blank'
  else return 'string_unquoted'
}

export function getType(tag) {
  if (tag.includes('number') || tag.startsWith('math')) return 'number'
  if (tag.includes('string')) return 'string'
  if (tag.includes('color')) return 'color'
  if (tag.includes('note')) return 'note'
  if (tag.startsWith('entity_variable_list')) return 'list'
  return 'mixed'
}

export function compareTypes(tag1, tag2) {
  const type1 = getType(tag1)
  const type2 = getType(tag2)
  if (type1 === 'mixed' || type2 === 'mixed') return true
  return type1 === type2
}

export function validType(tag, list) {
  for (let i = 0; i < list.length; i++) {
    let valid = false
    if (list[i] === '$number') {
      valid =
        tag.includes('number') ||
        tag.startsWith('entity_variable_value') ||
        tag.startsWith('entity_parameter') ||
        tag.startsWith('math') ||
        tag.startsWith('call_at_random') ||
        tag.startsWith('call_function_return') ||
        tag.startsWith('list_access')
    } else if (list[i] === '$number_integer') {
      valid =
        tag.includes('number_integer') ||
        tag.startsWith('entity_variable_value') ||
        tag.startsWith('entity_parameter') ||
        tag.startsWith('math') ||
        tag.startsWith('call_at_random') ||
        tag.startsWith('call_function_return') ||
        tag.startsWith('list_access')
    } else if (list[i] === '$string') {
      valid =
        tag.includes('string') ||
        tag.startsWith('entity_variable_value') ||
        tag.startsWith('entity_parameter') ||
        tag.startsWith('call_at_random') ||
        tag.startsWith('call_function_return') ||
        tag.startsWith('list_access')
    } else if (list[i] === '$boolean') {
      valid =
        tag.includes('boolean') ||
        tag.startsWith('entity_variable_value') ||
        tag.startsWith('entity_parameter') ||
        tag.startsWith('call_at_random') ||
        tag.startsWith('call_function_return') ||
        tag.startsWith('list_access')
    } else if (list[i] === '$quoted') {
      valid =
        tag.includes('string_quoted') ||
        tag.startsWith('entity_variable_value') ||
        tag.startsWith('entity_parameter') ||
        tag.startsWith('call_at_random') ||
        tag.startsWith('call_function_return') ||
        tag.startsWith('list_access')
    } else if (list[i] === '$value') {
      valid =
        tag.startsWith('entity_variable_value') ||
        tag.startsWith('entity_parameter') ||
        tag.startsWith('call_at_random') ||
        tag.startsWith('call_function_return') ||
        tag.startsWith('list_access')
    } else if (tag.startsWith(list[i])) valid = true

    if (valid) return true
  }

  return false
}

export function enUnaLlista(words, id_word) {
  // Estarà en una llista si hi ha una comanda de llista abans o després

  // Llista HEDY:  llista is|= bla, bla, bla blu
  // Llista Python: llista = [bla, bla, bla]
  // abans o després hi ha ',' sense comandes

  for (let i = id_word - 1; i >= 0; i--) {
    if ('comma' === words[i].command || 'bracket_open_definition' === words[i].command) return true
    if (words[i].command) break
  }
  for (let i = id_word + 1; i < words.length; i++) {
    if ('comma' === words[i].command || 'bracket_close_definition' === words[i].command) return true
    if (words[i].command) break
  }

  return false
}

/*  Detecta el tipus en una definició de variable.
    S'espera tenir etiquetades les comandes.
 */
export function getDefinitionType(wordsAfterDef, entities, hasBooleans = true) {
  if (enUnaLlista(wordsAfterDef, wordsAfterDef.length - 1)) return 'list'

  for (let i = 0; i < wordsAfterDef.length; i++) {
    // TODO: Pot millorar amb les operacions...
    if (wordsAfterDef[i].command) return 'value_mixed'
  }

  const despres = wordsAfterDef
    .map(w => w.text)
    .join(' ')
    .trim()

  if (entities && entities[despres]) {
    return entities[despres].subtype || 'value_mixed'
  }
  return 'value_' + detectTypeConstant(despres, true, hasBooleans)
}
