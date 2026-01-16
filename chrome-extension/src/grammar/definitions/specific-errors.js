/* Plantilla per definir errors específics:
  (Els errors específics són aquells que no es poden definir amb les regles generals)
  + codeerror: el codi de l'error que es vol mostrar (obligatori)
  + commands: Array amb les comandes on es vol aplicar l'error (default = NO CHECK)
  + tags: Array amb els tags on es vol aplicar l'error (default = NO CHECK)
  + levelStart: Nivell on comença la comanda [inclusiu] (default =1)
  + levelEnd: Nivell on acaba la comanda [inclusiu] (default =17)
  + hasBefore: RegExp que ha de tenir la paraula posterior al tag/commanda on es vol aplicar l'error (default = NO CHECK)
  + hasAfter: RegExp que ha de tenir la paraula anterior al tag/commanda es vol aplicar l'error (default = NO CHECK)
  + notlist: 'before' o 'after' per indicar que la paraula anterior o posterior no pot ser una llista (default = NO CHECK)
  + list: 'before' o 'after' per indicar que la paraula anterior o posterior ha de ser una llista (default = NO CHECK)
  + highlight: 'word', 'line', 'before_word', 'after_word', 'definition', 'match_last' o 'match_first' (default = 'word')
  + whenCommand: 'invalid' per indicar que l'error només s'aplica quan la comanda no és vàlida 
                 [no compleix el regex de comanda] (default = NO CHECK)
  + special_else: true per indicar que l'error només s'aplica a 'else' i 'elif' (default = NO CHECK)
  + special_callArguments: true per indicar que l'error només s'aplica a 'entity_function' (default = NO CHECK)
  + special_call_Return: true per indicar que l'error només s'aplica a 'entity_function' (default = NO CHECK)
  + beforeAndAfter: 'same', 'same-type', 'same-constant-text' per detectar que la paraula anterior i posterior 
                    han de ser iguals (default = NO CHECK)

*/

import * as def from './definitions.js'

// TODO alguns d'aquests errors s'haurien d'incloure a la sintaxi de comanda
const specificHedyErrors = [
  {
    commands: ['turn'],
    levelEnd: def.CMD_TURN_LEFTRIGHT.end,
    hasAfter: /^(?!left|right).+/g,
    highlight: 'after_word',
    codeerror: 'hy-turn-left-right',
  },
  {
    commands: ['print', 'ask', 'echo'],
    levelEnd: def.COMETES_TEXTOS.before(),
    hasAfter: /^(["']).*\1/g,
    highlight: 'after_word',
    codeerror: 'hy-unnecessary-quotes',
  },
  {
    commands: ['variable_define_is', 'variable_define_equal'],
    whenCommand: 'invalid',
    hasBefore: /[\p{L}_\d] +[\p{L}_\d]/gu,
    highlight: 'before',
    codeerror: 'hy-variabledef-multiplewords',
  },
  {
    commands: ['variable_define_is'],
    levelStart: def.CMD_EQUAL.start,
    highlight: 'word',
    hasAfter: /^(?!pressed)/g,
    codeerror: 'hy-recomended-equal',
  },
  {
    commands: ['from', 'to_list'],
    notlist: 'after',
    hasBefore: /(add|remove)\s/g,
    highlight: 'after_word',
    codeerror: 'hy-after-needs-list',
  },
  {
    commands: ['from', 'to_list'],
    list: 'before',
    hasBefore: /(add|remove)\s/g,
    highlight: 'before_word',
    codeerror: 'hy-before-needs-nolist',
  },
  {
    commands: ['pressed'],
    hasAfter: /^is\b/g,
    whenCommand: 'invalid',
    highlight: 'word',
    codeerror: 'hy-pressed-must-be-second',
  },
  {
    commands: ['pressed'],
    hasBefore: /\=$/g,
    whenCommand: 'invalid',
    highlight: 'word',
    codeerror: 'hy-pressed-needs-is',
  },
  {
    commands: ['at'],
    levelEnd: def.CMD_ATRANDOM.end,
    notlist: 'before',
    highlight: 'before_word',
    codeerror: 'hy-before-needs-list',
  },
  {
    commands: ['else', 'elif'],
    special_else: true,
    codeerror: 'hy-else-elif-needs-if',
  },
  {
    commands: ['in', 'not_in'],
    notlist: 'after',
    hasAfter: /^(?!range)/g,
    highlight: 'after_word',
    codeerror: 'hy-after-needs-list',
  },
  {
    commands: ['in', 'not_in'],
    list: 'before',
    highlight: 'before_word',
    codeerror: 'hy-before-needs-nolist',
  },
  {
    commands: ['compare_equal', 'compare_is'],
    levelStart: def.CMD_EQUALIGUAL.start,
    highlight: 'word',
    codeerror: 'hy-recomended-equalequal',
  },
  {
    commands: ['sum', 'rest', 'multiplication', 'division'],
    list: 'before',
    highlight: 'before_word',
    codeerror: 'hy-before-needs-nolist',
  },
  {
    commands: ['sum', 'rest', 'multiplication', 'division'],
    list: 'after',
    highlight: 'after_word',
    codeerror: 'hy-after-needs-nolist',
  },
  {
    commands: [
      'greater_than',
      'less_than',
      'greater_than_or_equal',
      'less_than_or_equal',
      'compare_equalequal',
      'not_equal',
      'compare_is',
      'compare_equal',
    ],
    list: 'before',
    highlight: 'before_word',
    codeerror: 'hy-before-needs-nolist',
  },
  {
    commands: [
      'greater_than',
      'less_than',
      'greater_than_or_equal',
      'less_than_or_equal',
      'compare_equalequal',
      'not_equal',
      'compare_is',
      'compare_equal',
    ],
    list: 'after',
    highlight: 'after_word',
    codeerror: 'hy-after-needs-nolist',
  },
  {
    commands: ['greater_than_or_equal', 'less_than_or_equal', 'compare_equalequal', 'compare_is', 'compare_equal'],
    beforeAndAfter: 'same',
    highlight: 'line',
    codeerror: 'hy-same-comparison-true',
  },
  {
    commands: ['greater_than', 'less_than', 'not_equal'],
    beforeAndAfter: 'same',
    highlight: 'line',
    codeerror: 'hy-same-comparison-false',
  },
  {
    commands: ['sum'],
    levelStart: def.MATES.start,
    beforeAndAfter: 'same-type',
    highlight: 'line',
    codeerror: 'hy-execting-same-type',
  },
  {
    commands: [
      'greater_than',
      'less_than',
      'greater_than_or_equal',
      'less_than_or_equal',
      'compare_equalequal',
      'not_equal',
      'compare_is',
      'compare_equal',
    ],
    beforeAndAfter: 'same-type',
    highlight: 'line',
    codeerror: 'hy-execting-same-type',
  },
  {
    commands: ['greater_than', 'less_than', 'not_equal'],
    beforeAndAfter: 'same-constant-text',
    highlight: 'line',
    codeerror: 'hy-always-true',
  },
  {
    commands: ['greater_than_or_equal', 'less_than_or_equal', 'compare_equalequal', 'compare_is', 'compare_equal'],
    beforeAndAfter: 'same-constant-text',
    highlight: 'line',
    codeerror: 'hy-always-false',
  },
  {
    commands: ['else'],
    levelStart: def.CMD_ELIF.start,
    hasAfter: /^if\b/g,
    highlight: 'after_word',
    codeerror: 'hy-use-elseif-instead',
  },
  {
    tags: ['entity'],
    match: /^\d/,
    codeerror: 'hy-entitydef-starts-with-number',
    highlight: 'word',
  },
  /* // TODO! no funciona correctament
    {
      commands: ['variable_define_equal', 'variable_define_is'],
      levelStart: 12,
      special_defiction: true,
      codeerror: 'hy-definition-wrong-format',
      highlight: 'definition',
      hasAfter: /(^(?! *([\p{L}_\d]+|['"].*?['"]|\[.*\]) *$)(?!.*,.*).+$|([, ]([\p{L}_\d]+|['"].*?['"]|\[.*\])){2})/gu,
    },*/
  {
    commands: ['define'],
    levelStart: def.FUNCIONS.start,
    hasAfter: /\b([\p{L}_\d]+)\b(?=.*\b(\1)\b)/gu,
    highlight: 'match_last',
    codeerror: 'hy-function-argument-duplicated',
  },
  {
    commands: ['comma_bracedlist'],
    levelStart: def.BRACED_LIST.start,
    whenCommand: 'invalid',
    hasBefore: /is |=/g,
    highlight: 'definition',
    codeerror: 'hy-comma-list-needs-brackets',
  },
  /*{
      commands: ['list_open'],
      levelStart: def.BRACED_LIST.start,
      hasAfter: /^[^\]]*$/g,
      codeerror: 'hy-list-open-needs-close',
    },*/
  {
    commands: ['bracket_open_access'],
    levelStart: def.BRACED_LIST.start,
    notlist: 'before',
    codeerror: 'hy-bracket-needs-before-list',
    highlight: 'before_word',
  },
  {
    commands: ['for'],
    levelStart: def.CMD_FOR.start,
    hasAfter: /\bis\b/g,
    highlight: 'line',
    codeerror: 'hy-bad-definition-for-is',
  },
  {
    commands: ['variable_define_is', 'variable_define_equal'],
    codeerror: 'hy-warn-access-set-operation',
    levelStart: def.BRACED_LIST.start,
    hasBefore: /\]/g,
    hasAfter: /\+|-|\*|\//gu,
    highlight: 'after_word',
  },
  {
    commands: ['bracket_open_access', 'bracket_open_definition'],
    codeerror: 'hy-not-expecting-coma-final',
    hasAfter: /,(?= *$)|,(?= *\] *$)/g,
    highlight: 'match_last',
  },
  {
    commands: ['or'],
    codeerror: 'hy-warn-or-and-exclusive-condition',
    hasAfter: /\band\b/g,
    highlight: 'line',
  },
  {
    commands: ['and'],
    codeerror: 'hy-warn-or-and-exclusive-condition',
    hasAfter: /\bor\b/g,
    highlight: 'line',
  },
  {
    tags: ['constant_string_quoted'],
    match: /^(['"])(?!.*\1).*/gu,
    codeerror: 'hy-string-must-end-with-quotes',
    levelStart: def.COMETES_TEXTOS.start,
    highlight: 'word',
  },
]

export default specificHedyErrors
