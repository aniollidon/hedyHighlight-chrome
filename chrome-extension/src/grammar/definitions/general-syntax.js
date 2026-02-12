/*
  Plantilla per definir regles generals. (pensat per les altres coses que no siguin comandes):
   + codeerror: el codi de l'error que es vol mostrar (obligatori)
    + allowed: Array amb els tags o grup de tags permesos (default = NO CHECK)
    + refused: Array amb els tags o grup de tags no permesos (default = NO CHECK)
    + levelStart: Nivell on comença la comanda [inclusiu] (default =1)
    + levelEnd: Nivell on acaba la comanda [inclusiu] (default =17)
    + subphrase: Subfrase (subsintagma) on pertany (default = ANY) *Un subsintagma és una unitat dins un sintagma (ex: operació dins una expressió)
    + subpartial: Subfrase (subparcial) on pertany (default = ANY) *Un subparcial és un sintagma consecutiu en una frase (ex: condició->acció)
    + positionInSintagma: Comprova a la posició de la paraula en el sintagma (default = NO CHECK)
    + special_orAllowed: Afegeix les definicions a la llista de permesos, [no són una paraula]  (default = NO CHECK)
    + identationFound: Indica si s'ha d'aplicar la regla només si hi ha identació (true) o no (false) (default = NO CHECK)
    + parentTag: Tag del sintagma pare on s'ha d'aplicar la regla (default = NO CHECK)
  */

import * as def from './definitions.js'

const hedyGeneralSyntax = [
  {
    refused: ['constant_blank'],
    codeerror: 'hy-blanks-not-allowed',
  },
  {
    allowed: ['call_echo', 'call_function', 'call_ask', 'call_print', 'command', 'declaration', 'entity_function'],
    codeerror: 'hy-lines-must-start-with',
    positionInSintagma: 0,
    subphrase: 0,
    highlight: 'line',
  },
  {
    refused: ['call_ask'],
    levelStart: def.CMD_ASK_IS.start,
    codeerror: 'hy-ask-not-in-definition',
    positionInSintagma: 0,
  },
  {
    levelStart: def.COMETES_ARREU.start,
    refused: ['constant_string_unquoted'],
    codeerror: 'hy-text-must-be-quoted',
  },
  {
    refused: ['call_function_return'],
    subphrase: 0,
    levelStart: def.RETURN_FUNCTION.start,
    codeerror: 'hy-function-return-unused',
  },

  {
    subpartial: { after: 0 },
    positionInSintagma: 0,
    subphrase: 0,
    levelStart: def.CONDITIONAL_INLINE_WARN.start,
    codeerror: 'hy-actions-must-be-in-next-sentence',
    parentTag: 'condition',
    highlight: 'previous-char',
  },

  {
    subpartial: { after: 0 },
    subphrase: 0,
    positionInSintagma: 0,
    levelStart: def.LOOP_INLINE_WARN.start,
    codeerror: 'hy-actions-must-be-in-next-sentence',
    parentTag: 'loop',
    highlight: 'previous-char',
  },
  {
    subpartial: 0,
    subphrase: 0,
    positionInSintagma: 0,
    levelStart: def.LOOP_INLINE.start,
    levelEnd: def.LOOP_INLINE.end,
    parentTag: 'loop',
    highlight: 'previous-char',
    codeerror: 'hy-actions-must-be-in-same-sentence',
  },

  {
    subpartial: 0,
    subphrase: 0,
    positionInSintagma: 0,
    subphrase: 0,
    identationFound: true,
    levelEnd: def.USES_SCOPE.before(),
    codeerror: 'hy-identation-not-expected-yet',
    highlight: 'identation',
  },

  {
    refused: ['constant_color_language'],
    codeerror: 'hy-recommended-english-color-names',
  },

  {
    refused: ['unbraced_list'],
    codeerror: 'hy-bracketed-lists-required',
    levelStart: def.BRACED_LIST.start,
    levelEnd: def.BRACED_LIST.end,
  },
]

export { hedyGeneralSyntax }
