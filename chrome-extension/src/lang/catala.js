const texts = {
  reloading: "S'està reiniciant l'extensió hedy-highlighting...",
  copilot_disable_question: 'Vols desactivar GitHub Copilot per als fitxers Hedy?',
  copilot_disabled: 'GitHub Copilot desactivat per als fitxers Hedy',
  copilot_error: 'Error al configurar GitHub Copilot: ',
  yes: 'Sí',
  no: 'No',
}

const colors = ['negre', 'blau', 'marró', 'gris', 'verd', 'taronja', 'rosa', 'lila', 'vermell', 'blanc', 'groc']
const commands = {
  compare_is: 'is (comparació)',
  variable_define_is: 'is (definició de variable)',
  comma: 'coma',
  to_list: 'to (llista)',
  to_range: 'to (després de range)',
  compare_equal: 'igual (comparació)',
  variable_define_equal: 'igual (definició de variable)',
  sum: 'suma (+)',
  rest: 'resta (-)',
  multiplication: 'multiplicació (*)',
  division: 'divisió (/)',
  comma_argument: "coma (separador d'arguments)",
  greater_than: 'major (>)',
  less_than: 'menor (<)',
  greater_than_or_equal: 'major o igual (>=)',
  less_than_or_equal: 'menor o igual (<=)',
  compare_equalequal: 'igual (==)',
  not_equal: 'diferent (!=)',
  parenthesis_open: "parèntesi obert '('",
  parenthesis_close: "parèntesi tancat ')'",
  colon: "dos punts ':'",
}

const errors = {
  'hy-command-context': {
    message: "La comanda '[COMMAND]' no es pot fer servir d'aquesta manera.",
  },
  'hy-type-context': {
    message: "El text '[COMMAND]' que és [TYPE] no es pot fer servir d'aquesta manera.",
  },
  'hy-recommended-equal': {
    message: "És més recomanable fer servir '=' enlloc de 'is'.",
  },
  'hy-lines-must-start-with': {
    message: 'Les línies han de començar amb una comanda o una definició.',
  },
  'hy-text-must-be-quoted': {
    message: "Aquest text hauria d'anar entre cometes. Potser és una variable mal definida?",
  },
  'hy-recommended-equalequal': {
    message: "En aquest nivell ja es pot fer servir '==' enlloc de '[COMMAND]'.",
  },
  'hy-entity-changes-content-type': {
    message: "Vigila que la variable '[NAME]' ha canviat el tipus a respecte la seva definició a la línia [LINEDEF].",
  },
  'hy-at-begining': {
    message: "La comanda '[COMMAND]' ha d'anar al començament.",
  },
  'hy-command-missing-argument': {
    message: "La comanda '[COMMAND]' necessita almenys un argument després.",
    messagePlural: "La comanda '[COMMAND]' necessita [VALUE] arguments després.",
    messageZero: "La comanda '[COMMAND]' no necessita arguments.",
  },
  'hy-command-missing-argument-before': {
    message: "La comanda '[COMMAND]' necessita un argument abans.",
    messagePlural: "La comanda '[COMMAND]' necessita [VALUE] arguments abans.",
    messageZero: "La comanda '[COMMAND]' no necessita arguments abans.",
  },
  'hy-command-unexpected-argument': {
    message: "La comanda '[COMMAND]' només accepta un argument després.",
    messagePlural: "La comanda '[COMMAND]' només accepta [VALUE] arguments després.",
    messageZero: "La comanda '[COMMAND]' no accepta cap valor després.",
  },
  'hy-definition-unexpected-argument': {
    message:
      "En una definició de variable només s'accepta un element. Si vols una llista, separa els elements amb comes.",
  },
  'hy-command-unexpected-argument-conditional': {
    message: "La comanda '[COMMAND]' només accepta una condició després.",
  },
  'hy-execting-function-definition': {
    message:
      "S'espera una definició de funció. El format correcte és 'define <nom>' o a partir de nivell 13 'define <nom> with <arg1>, <arg2> <...>'.",
  },
  'hy-execting-function-call': {
    message: "S'espera una crida a un nom de funció existent després de '[NAME]'.",
  },
  'hy-command-missing-argument-comma': {
    message: "Després d'una coma hi ha d'haver un element.",
  },
  'hy-separator-required': {
    message: "Els elements han d'anar separats per comes. Posa una coma abans de '[NAME]'.",
  },
  'hy-separator-recommended': {
    message: "Es recomana posar una coma abans de '[NAME]'.",
  },
  'hy-level-unavailable-yet': {
    message: "La comanda '[COMMAND]' encara no es pot fer servir en aquest nivell.",
  },
  'hy-level-unavailable-deprecated': {
    message: "La comanda '[COMMAND]' ja no es pot fer servir en aquest nivell.",
  },
  'hy-to-lowercase-command': {
    message: "Potser volies utilitzar la comanda '[LOWER]'?, si és així ha d'estar tota en minúscules.",
  },
  'hy-entity-out-of-scope': {
    message:
      "La variable '[NAME]' s'està usant fora del seu bloc d'identació i pot no existir. La variable s'ha definit a la línia [LINEDEF] que és fora del bloc actual.",
  },
  'hy-always-false': {
    message: 'La condició sempre és falsa i mai es compleix.',
  },
  'hy-always-true': {
    message: 'La condició sempre és certa i sempre es compleix.',
  },
  'hy-same-comparison-true': {
    message: 'No té massa sentit comparar dos cops el mateix. Sempre serà cert.',
  },
  'hy-same-comparison-false': {
    message: 'No té massa sentit comparar dos cops el mateix. Sempre serà fals.',
  },
  'hy-execting-same-type': {
    message: "La comanda '[COMMAND]' espera el mateix tipus abans i després.",
  },
  'hy-execting-number': {
    message: "La comanda '[COMMAND]' espera un número. S'ha trobat [TYPE].",
  },
  'hy-execting-number-integer': {
    message: "La comanda '[COMMAND]' espera un número enter. S'ha trobat [TYPE].",
  },
  'hy-execting-command-times': {
    message:
      "La comanda '[COMMAND]' espera un número enter i després la comanda 'times'. S'ha trobat [TYPE] a la segona posició.",
  },
  'hy-execting-number-string': {
    message: "La comanda '[COMMAND]' espera números o text. S'ha trobat '[NAME]' que és [TYPE].",
  },
  'hy-execting-number-note': {
    message: "La comanda '[COMMAND]' espera una nota o un número. S'ha trobat '[NAME]' que és [TYPE].",
  },
  'hy-execting-color': {
    message: "La comanda '[COMMAND]' espera un color. S'ha trobat '[NAME]' que és [TYPE].",
  },
  'hy-execting-condition': {
    message: "La comanda '[COMMAND]' espera una condició després. S'ha trobat [TYPE].",
  },
  'hy-use-elseif-instead': {
    message: "Si després d'un 'else' vols fer 'if', utilitza la comanda 'elif'.",
  },
  'hy-after-needs-list': {
    message: "Després de '[COMMAND]' cal una llista.",
  },
  'hy-before-needs-list': {
    message: "Abans de '[COMMAND]' cal una llista.",
  },
  'hy-after-needs-nolist': {
    message: "Després de '[COMMAND]' no pot haver-hi una llista.",
  },
  'hy-before-needs-nolist': {
    message: "Abans de '[COMMAND]' no pot haver-hi una llista.",
  },
  'hy-cant-print-list': {
    message: 'Les llistes no es poden imprimir directament.',
  },
  'hy-softwarn-print-list': {
    message: 'Segur que vols imprimir una llista? i no volies imprimir un element de la llista?',
  },
  'hy-cant-print-function': {
    message: 'Les funcions no es poden imprimir directament. Fes servir la comanda "call".',
  },
  'hy-add-remove-notlist': {
    message:
      "El format correcte és 'add <item> to <llista>' o 'remove <item> from <llista>'. No pot haver-hi una llista al lloc de l'item.",
  },
  'hy-pressed-must-be-second': {
    message: "La comanda '[COMMAND]' ha d'anar en segona posició, després de 'is'.",
  },
  'hy-turn-left-right': {
    message: "La comanda '[COMMAND]' només accepta 'left' o 'right' en aquest nivell.",
  },
  'hy-variabledef-multiplewords': {
    message: 'Per definir una variable només pots fer servir una paraula.',
  },
  'hy-not-decimals': {
    message: 'En aquest nivell els decimals encara no estan permesos.',
  },
  'hy-not-print-decimals': {
    message: 'No es poden imprimir números decimals en aquest nivell, posa-hi cometes al voltant i serà un text.',
  },
  'hy-not-numbers': {
    message: 'En aquest nivell els números encara no estan permesos. Posa-hi cometes i serà un text.',
  },
  'hy-else-elif-needs-if': {
    message: "La comanda '[COMMAND]' espera que s'hagi usat 'if' anteriorment.",
  },
  'hy-blanks-not-allowed': {
    message: "Els espais en blanc s'han d'omplir amb codi!",
  },
  'hy-identation-not-expected': {
    message: "La identació no és correcta. Només després d'un bucle o condició cal indentar.",
  },
  'hy-identation-not-expected-yet': {
    message: "Hi ha un espai abans de la línia que no hi ha de ser. Elimina'l.",
  },
  'hy-identation-large': {
    message: 'La indentació és massa gran. Afegeix només [EXPECTED] espais extres respecte la línia anterior.',
  },
  'hy-identation-small': {
    message: 'La indentació és massa petita. Afegeix [EXPECTED] espais extres respecte la línia anterior.',
  },
  'hy-identation-expected': {
    message:
      "S'Esperava una indentació en aquesta línia que no s'ha trobat. Afegeix [EXPECTED] espais extres respecte la línia anterior.",
  },
  'hy-fileends-identation-expected': {
    message: "S'ha trobat una condició o bucle sense un bloc de codi identat posterior.",
  },
  'hy-identation-multiple-unavailable': {
    message:
      'En aquest nivell encara no es pot definir un bucle/condició dins un altre bucle/condició. Només es permeten bucles/condicions independents.',
  },
  'hy-identation-misalignment': {
    message:
      "Cal ser consistent amb la indentació. Fins ara feies servir [EXPECTED] espais per identar però en aquesta línia n'hi ha [FOUND]. Els espais utilitzats han de ser múltiple de [EXPECTED].",
  },
  'hy-unnecessary-quotes': {
    message: 'En aquest nivell encara no cal cometes per aquest text.',
  },
  'hy-entitydef-starts-with-number': {
    message: 'Els noms de variables no poden començar per un número.',
  },
  'hy-function-argument-duplicated': {
    message: 'Al definir una funció no es poden repetir arguments ni utilitzar el nom de la mateixa funció.',
  },
  'hy-function-missing-argument': {
    message: "La funció '[NAME]' espera [EXPECTED] arguments, se n'han trobat [FOUND].",
  },
  'hy-function-unexpected-argument': {
    message: "La funció '[NAME]' només espera [VALUE] arguments.",
  },
  'hy-function-parenthesis-missing': {
    message: "La funció '[NAME]' necessita parèntesis '()' per als seus arguments.",
  },
  'hy-function-parenthesis-close': {
    message: "Els parèntesis de la funció '[NAME]' s'han de tancar amb ')'.",
  },
  'hy-ask-not-in-definition': {
    message: "La comanda 'ask' ha d'anar dins d'una definició de variable.",
  },
  'hy-pressed-needs-is': {
    message: "La comanda '[COMMAND]' no funciona amb '=', només funciona amb un 'is' davant.",
  },
  'hy-execting-parameter': {
    message: "En la definició d'una funció s'espera un nom de paràmetre vàlid. S'ha trobat [TYPE].",
  },
  'hy-refused-function-void': {
    message: 'Aquesta funció no retorna res, només es pot cridar sola.',
  },
  'hy-warn-function-return-operation': {
    message:
      'De moment no pots operar amb les crides a funcions, és una bona idea, però encara no es pot. Guarda el resultat en una variable.',
  },
  'hy-warn-storing-condition': {
    message: 'De moment no pots guardar les condicions, és una bona idea, però encara no es pot.',
  },
  'hy-warn-math-operation-compare': {
    message:
      'De moment no pots comparar operacions matemàtiques, és una bona idea, però encara no es pot. Guarda el resultat en una variable.',
  },
  'hy-warn-math-operation-limit': {
    message:
      'De moment no pots limitar amb operacions matemàtiques, és una bona idea, però encara no es pot. Guarda el resultat en una variable.',
  },
  'hy-warn-random-operation': {
    message:
      "De moment no pots fer operacions amb el resultat de 'at random', és una bona idea, però encara no es pot. Guarda el resultat en una variable.",
  },
  'hy-warn-access-set-operation': {
    message:
      'De moment no pots guardar directament dins una posició de la llista una operació, és una bona idea, però encara no es pot. Guarda el resultat en una variable i guarda-la posteriorment.',
  },
  'hy-atrandom-usage': {
    message: "La comanda 'random' espera la comanda 'at' abans.",
  },
  'hy-random-braced-usage': {
    message: "La comanda 'random' ha d'estar dins uns clàudators. Per exemple: 'llista[random]'.",
  },
  'hy-comma-list-needs-brackets': {
    message:
      "Sembla que estas intentant definir una llista sense claudàtors. Recorda que les llistes s'han de rodejar amb claudàtors.",
  },
  'hy-list-open-needs-close': {
    message: 'Falta tancar el claudàtor de la llista.',
  },
  'hy-parenthesis-open-needs-close': {
    message: 'Falta tancar el parèntesi.',
  },
  'hy-function-return-unused': {
    message: "Aquesta funció retorna un valor que no s'està guardant en cap variable.",
  },
  'hy-list-definition-types': {
    message: "Dins una definició de llista només s'accepten valors constants. S'ha trobat [TYPE].",
  },
  'hy-list-access-types': {
    message: "Només pots accedir a llistes amb números enters o variables. S'ha trobat [TYPE].",
  },
  'hy-bracket-needs-before-list': {
    message: "Abans d'un accés per clàudator cal una llista.",
  },
  'hy-access-brackets-format-arguments': {
    message:
      "En l'accés a una llista per clàudator cal seguir el format 'llista[num]', on només hi ha un valor d'accés.",
  },
  'hy-definition-wrong-format': {
    message:
      "La definició no és correcta, s'ha trobat múltiples paraules, si son una llista han d'estar separades per comes",
  },
  'hy-bad-definition-for-is': {
    message: "La definició de 'for' necessita un 'in' enlloc de 'is'.",
  },
  'hy-bracket-open-needs-close': {
    message: "La comanda '[COMMAND]' espera que es tanqui el claudàtor.",
  },
  'hy-expecting-close': {
    message: "La comanda '[COMMAND]' espera [TYPE] al final de línia.",
  },
  'hy-not-expecting-coma-final': {
    message: 'No pot haver-hi una coma sola al final',
  },
  'hy-missing-colon': {
    message: "La comanda '[COMMAND]' espera ':' al final de la línia.",
  },
  'hy-refused-command-for-print': {
    message: 'Aquesta comanda no es pot imprimir directament.',
  },
  'hy-warn-or-and-exclusive-condition': {
    message:
      "Tot i que és una bona idea, encara no es poden fer servir alhora 'or' i 'and' en una mateixa condició. Fes servir més d'un 'if'.",
  },
  'hy-string-must-end-with-quotes': {
    message: "S'ha obert unes cometes però no s'han tancat.",
  },
  'hy-command-entity-conflict': {
    message: "El nom '[NAME]' s'usa per una comanda i pot causar conflictes. No es recomana utilitzar-lo.",
  },
  'hy-actions-must-be-in-next-sentence': {
    message: "És molt recomanable fer un salt de línia abans de l'acció.",
  },
  'hy-actions-must-be-in-same-sentence': {
    message: "L'acció ha d'estar en la mateixa frase que el bucle o condició. No pot haver-hi un salt de línia.",
  },
  'hy-entity-not-used': {
    message: "S'ha definit [TYPE] anomenada '[NAME]' que no s'està fent servir.",
  },
  'hy-command-parenthesis-missing': {
    message: "La comanda '[COMMAND]' necessita parèntesis '()' per als seus arguments.",
  },
  'hy-command-parenthesis-recommended': {
    message: "Es recomana posar parèntesis '()' als arguments de la comanda '[COMMAND]'.",
  },
  'hy-execting-left-right': {
    message: "La comanda '[COMMAND]' només accepta 'left' o 'right' després.",
  },
  'hy-list-extra-element': {
    message:
      "Dins una llista només es poden posar elements separats per comes. S'ha trobat un element extra sense comes.",
  },
  'hy-unnecessary-parentheses': {
    message: "Els parèntesis no s'han de fer servir en aquesta comanda.",
  },
  'hy-unnecessary-comma': {
    message: 'No cal fer servir una coma en aquesta comanda.',
  },
  'hy-unnecessary-colon': {
    message: "En aquest nivell encara no calen els dos punts. Elimina'ls.",
  },
  'hy-recommended-input': {
    message: "Es recomana fer servir 'input' enlloc de 'ask'.",
  },
  'hy-recommended-def': {
    message: "Es recomana fer servir 'def' enlloc de 'define'.",
  },
  'hy-recommended-english-color-names': {
    message: 'Es recomana utilitzar els noms de colors en anglès.',
  },
  'hy-bracketed-lists-required': {
    message: 'En aquest nivell les llistes han de estar rodejades de claudàtors.',
  },
  'hy-execting-color-quoted': {
    message: "La comanda '[COMMAND]' espera un color entre cometes. S'ha trobat '[NAME]' que és [TYPE].",
  },
  'hy-space-missing-is-and-bracket': {
    message: "Posa un espai després de 'is' i abans del claudàtor. ",
  },
}

export function command2text(command) {
  if (commands[command]) return commands[command]
  return command
}

export function type2text(type) {
  let tipus = ''
  if (type.startsWith('constant_number')) {
    if (type === 'constant_number_decimal') tipus = 'un número decimal'
    else tipus = 'un número enter'
  } else if (type.startsWith('constant_string_unquoted')) {
    tipus = 'un text sense cometes'
  } else if (type.startsWith('constant_string_quoted')) {
    tipus = 'un text'
  } else if (type.startsWith('constant_color_language_quoted')) {
    tipus = 'un color entrecomillat escrit en català'
  } else if (type.startsWith('constant_color_language')) {
    tipus = 'un color escrit en català'
  } else if (type.startsWith('constant_color_quoted')) {
    tipus = 'un color entre cometes'
  } else if (type.startsWith('constant_color')) {
    tipus = 'un color sense cometes'
  } else if (type.startsWith('constant_note_quoted')) {
    tipus = 'una nota entre cometes'
  } else if (type.startsWith('constant_note')) {
    tipus = 'una nota'
  } else if (type.startsWith('constant_boolean')) {
    tipus = 'un valor booleà'
  } else if (type.startsWith('constant_blank')) {
    tipus = 'un espai en blanc'
  } else if (type.startsWith('list_empty')) {
    tipus = 'una llista buida'
  } else if (type.includes('list')) {
    tipus = 'una llista'
  } else if (type.startsWith('tuple_empty')) {
    tipus = 'uns parèntesis buits'
  } else if (type.includes('tuple')) {
    tipus = 'uns parèntesis'
  } else if (type.startsWith('entity_function')) {
    tipus = 'un nom de funció'
  } else if (type.startsWith('entity_parameter')) {
    tipus = 'un paràmetre'
  } else if (type.startsWith('entity_variable')) {
    tipus = 'una variable'
  } else if (type.startsWith('command')) {
    tipus = 'la comanda ' + command2text(type.replace('command_', ''))
  } else if (type.startsWith('call_function_return')) {
    tipus = 'una crida a una funció amb retorn'
  } else if (type.startsWith('call_function_void')) {
    tipus = 'una crida a una funció sense retorn'
  } else if (type.startsWith('call_ask')) {
    tipus = 'una pregunta amb ask'
  } else if (type.startsWith('call')) {
    tipus = 'una crida a una funció'
  } else if (type.startsWith('condition')) {
    let tt = type.replace('condition_command_', '')
    tipus = 'una condició ' + command2text(tt)
  } else if (type.startsWith('math')) {
    tipus = 'una operació matemàtica'
  } else if (type.startsWith('braced_list')) {
    tipus = 'una definició de llista'
  } else tipus = 'un ' + type

  return tipus
}

export function error2text(errorcode) {
  let res = errors[errorcode]
  if (!res) res = { message: errorcode }

  if (!res.message) res.message = errorcode
  if (!res.messagePlural) res.messagePlural = res.message
  if (!res.messageZero) res.messageZero = res.message
  return res
}

export function getText(code) {
  if (texts[code]) return texts[code]
  return code
}

export function isColor(name) {
  return colors.includes(name.toLowerCase())
}
