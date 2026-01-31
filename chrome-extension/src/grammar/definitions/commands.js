/*
  Plantilla per definir una comanda:
  + text: Text de la comanda (obligatori)
  + name: Nom de la comanda (default =text)
  + levelStart: Nivell on comença la comanda [inclusiu] (default =1)
  + levelEnd: Nivell on acaba la comanda [inclusiu] (default =17)
  + atBegining: Si la comanda ha d'anar al principi de la línia (default =false)
  + hasBefore: RegEx que ha d'anar abans de la comanda (default =null) <determina validesa>
  + hasAfter: RegEx que ha d'anar després de la comanda (default =null) <determina validesa>
  + argumentsAfter: Número d'elements que ha de tenir la comanda (default = 0 | NO CHECK)
  + argumentsBefore: Número d'elements que ha de tenir la comanda abans (default = 0 | NO CHECK)
  + minArgumentsAfter: Número mínim d'elements que ha de tenir la comanda (default = NO CHECK)
  + minArgumentsBefore: Número mínim d'elements que ha de tenir la comanda abans (default = NO CHECK)
  + concatOn: Quines comandes estàn permeses per concatenar accions. Per exemple 1 + 1 + 2 [NO contigues](default = NO CHECK)
  + usesParameters: Si la comanda fa servir paràmetres (default = false)
  + closedBy: Commanda de tancament de la comanda (default = NO CHECK)
  + arguments: Array amb les restriccions de sintaxi dels elements de la comanda
    + codeerror: Codi de l'error (obligatori)
    + levelStart: Nivell on comença la restricció [inclusiu] (default =1)
    + levelEnd: Nivell on acaba la restricció [inclusiu] (default =17)
    + allowed: Array amb els tags o grup de tags permesos (default = NO CHECK)
    + refused: Array amb els tags o grup de tags permesos (default = NO CHECK)
    + position: Posició de l'argument a comprovar (default =  NO CHECK)
  + syntax: Array amb definicions de sintaxi anteriors que poden variar la sintaxi de la comanda en funció del nivell
    + levelStart: Nivell on comença la restricció [inclusiu] (default =1)
    + levelEnd: Nivell on acaba la restricció [inclusiu] (default =17)
    + ... // Qualsevol restricció de sintaxi anterior
  Grups de tags
  + $number: Número + retorn de numeros (funcions, variables, etc.)
  + number_integer: Número enter + retorn de numeros (funcions, variables, etc.)
  + $string: String + retorn de strings (funcions, variables, etc.)
  + $quoted: String entre cometes + retorn de strings (funcions, variables, etc.)
  + $value: retorns (funcions, variables, etc.)
*/

import * as def from './definitions.js'

const operationTemplate = {
  levelStart: def.MATES.start,
  argumentsAfter: 1,
  argumentsBefore: 1,
  concatOn: ['sum', 'rest', 'multiplication', 'division'],
  arguments: [
    {
      allowed: ['$number'],
      codeerror: 'hy-execting-number',
    },
    {
      refused: ['call_function_return'],
      codeerror: 'hy-warn-function-return-operation',
    },
  ],
}

const printableTemplate = {
  arguments: [
    {
      refused: ['entity_variable_list'],
      levelEnd: def.PRINT_LIST.before(),
      codeerror: 'hy-cant-print-list',
    },
    {
      refused: ['entity_variable_list'],
      levelStart: def.PRINT_LIST.start,
      codeerror: 'hy-softwarn-print-list',
    },
    {
      refused: ['entity_function'],
      codeerror: 'hy-cant-print-function',
    },
    {
      refused: ['constant_string_quoted'],
      levelEnd: def.COMETES_TEXTOS.before(),
      codeerror: 'hy-unnecessary-quotes',
    },
    {
      levelStart: def.COMETES_TEXTOS.start,
      refused: ['constant_string_unquoted'],
      codeerror: 'hy-text-must-be-quoted',
    },
    {
      levelStart: def.COMETES_TEXTOS.start,
      levelEnd: def.PRINT_BOOLEANS.before(),
      allowed: ['$number', '$quoted'],
      codeerror: 'hy-execting-number-string',
    },
    {
      levelStart: def.PRINT_BOOLEANS.start,
      allowed: ['$number', '$quoted', 'constant_boolean'],
      codeerror: 'hy-execting-number-string',
    },
    {
      refused: ['command'],
      codeerror: 'hy-refused-command-for-print',
    },
    {
      levelStart: def.COMETES_TEXTOS.start,
      levelEnd: def.NUMBERS.before(),
      refused: ['constant_number'],
      codeerror: 'hy-not-numbers',
    },
    {
      levelStart: def.DECIMALS.start,
      levelEnd: def.PRINT_DECIMALS.before(),
      refused: ['constant_number_decimal'],
      codeerror: 'hy-not-print-decimals',
    },
  ],
}

const commandDefinition = [
  {
    // S'ha de definir abans de print sense parèntesis
    name: 'print_parenthesis',
    text: 'print',
    levelStart: def.PARENTHESES.start,
    levelEnd: def.PARENTHESES.end,
    parenthesis: true, // ja busca els parèntesis inici i final
    atBegining: true,
    argumentsAfter: 1,
    concatOn: ['comma'],
    ...printableTemplate,
  },
  {
    text: 'print',
    atBegining: true,
    minArgumentsAfter: 1,
    ...printableTemplate,
  },
  {
    text: 'turn',
    atBegining: true,
    argumentsAfter: 1,
    arguments: [
      {
        levelStart: def.CMD_TURN_LEFTRIGHT.start,
        levelEnd: def.CMD_TURN_LEFTRIGHT.end,
        allowed: ['command_left', 'command_right'],
        codeerror: 'hy-execting-left-right',
      },
      {
        levelStart: def.CMD_TURN_ANGLE.start,
        allowed: ['$number'],
        codeerror: 'hy-execting-number',
      },
    ],
  },
  {
    text: 'forward',
    atBegining: true,
    argumentsAfter: 1,
    arguments: [
      {
        allowed: ['$number'],
        codeerror: 'hy-execting-number',
      },
    ],
  },
  {
    text: 'play',
    atBegining: true,
    argumentsAfter: 1,
    arguments: [
      {
        allowed: ['$number', 'constant_note'],
        codeerror: 'hy-execting-number-note',
      },
    ],
  },
  {
    text: 'color',
    atBegining: true,
    argumentsAfter: 1,
    arguments: [
      {
        allowed: ['$value', 'constant_color'],
        codeerror: 'hy-execting-color',
      },
    ],
  },
  {
    text: 'sleep',
    levelStart: def.CMD_SLEEP.start,
    atBegining: true,
    argumentsAfter: [1, 0],
    arguments: [
      {
        allowed: ['$number'],
        codeerror: 'hy-execting-number',
      },
    ],
  },
  {
    text: 'clear',
    levelStart: def.CMD_CLEAR.start,
    atBegining: true,
    argumentsAfter: 0,
  },
  {
    text: 'ask',
    name: 'ask1',
    levelStart: def.CMD_ASK_NOIS.start,
    levelEnd: def.CMD_ASK_NOIS.end,
    atBegining: true,
    minArgumentsAfter: 1,
  },
  {
    text: 'ask',
    hasBefore: /^[\p{L}_\d]+ (is|=)$/gu,
    levelStart: def.CMD_ASK_IS.start,
    levelEnd: def.CMD_ASK_IS.end,
    minArgumentsAfter: 1,
    ...printableTemplate,
  },
  {
    text: 'input',
    hasBefore: /^[\p{L}_\d]+ (is|=)$/gu,
    levelStart: def.CMD_INPUT.start,
    levelEnd: def.CMD_INPUT.end,
    parenthesis: true, // ja busca els parèntesis inici i final
    argumentsAfter: 1,
    concatOn: ['comma'],
    ...printableTemplate,
  },
  {
    text: 'echo',
    atBegining: true,
    levelStart: def.CMD_ECHO.start,
    levelEnd: def.CMD_ECHO.end,
    minArgumentsAfter: 0,
    maxArgumentsAfter: 1,
  },
  {
    text: 'right',
    hasBefore: /^turn$/g,
    levelStart: def.CMD_TURN_LEFTRIGHT.start,
    levelEnd: def.CMD_TURN_LEFTRIGHT.end,
  },
  {
    text: 'left',
    hasBefore: /^turn$/g,
    levelStart: def.CMD_TURN_LEFTRIGHT.start,
    levelEnd: def.CMD_TURN_LEFTRIGHT.end,
  },
  {
    text: 'is',
    name: 'compare_is',
    levelStart: def.CMD_IS.start,
    argumentsAfter: 1,
    hasBefore: /^(if|elif|while) .*/gu,
    arguments: [
      {
        levelEnd: def.COMETES_ARREU.before(),
        allowed: ['$number', '$string', 'command_pressed'],
        codeerror: 'hy-execting-number-string',
      },
      {
        levelStart: def.COMETES_ARREU.start,
        allowed: ['$number', '$quoted', 'command_pressed', '$boolean'],
        codeerror: 'hy-execting-number-string',
      },
      {
        refused: ['math'],
        codeerror: 'hy-warn-math-operation-compare',
      },
      {
        refused: ['call_function_return'],
        codeerror: 'hy-warn-function-return-operation',
      },
      {
        refused: ['call_at_random'],
        codeerror: 'hy-warn-random-operation',
      },
    ],
  },
  {
    // No hauria d'importar l'ordre, però sino no funciona l'error hy-variabledef-multiplewords
    text: 'is',
    name: 'variable_define_is',
    levelStart: def.CMD_IS.start,
    concatOn: ['comma'],
    hasBefore: /^[\p{L}\d_]+ *(\[ *[\p{L}\d_]+ *\])?$/gu,
    argumentsAfter: 1,
    arguments: [
      {
        levelEnd: def.COMETES_ARREU.before(),
        refused: ['constant_string_quoted'],
        codeerror: 'hy-unnecessary-quotes',
      },
      {
        refused: ['function_call_void'],
        codeerror: 'hy-refused-function-void',
      },
      {
        refused: ['condition'],
        codeerror: 'hy-warn-storing-condition',
      },
    ],
  },
  {
    text: '=',
    name: 'compare_equal',
    levelStart: def.CMD_EQUAL.start,
    argumentsAfter: 1,
    hasBefore: /^(if|elif|while) .*/gu,
    arguments: [
      {
        levelEnd: def.COMETES_ARREU.before(),
        allowed: ['$number', '$string'],
        codeerror: 'hy-execting-number-string',
      },
      {
        levelStart: def.COMETES_ARREU.start,
        allowed: ['$number', '$quoted', '$boolean'],
        codeerror: 'hy-execting-number-string',
      },
      {
        refused: ['math'],
        codeerror: 'hy-warn-math-operation-compare',
      },
      {
        refused: ['call_function_return'],
        codeerror: 'hy-warn-function-return-operation',
      },
      {
        refused: ['call_at_random'],
        codeerror: 'hy-warn-random-operation',
      },
    ],
  },
  {
    // No hauria d'importar l'ordre, però sino no funciona l'error hy-variabledef-multiplewords
    text: '=',
    name: 'variable_define_equal',
    levelStart: def.CMD_EQUAL.start,
    concatOn: ['comma'],
    hasBefore: /^[\p{L}\d_]+ *(\[ *[\p{L}\d_]+ *\])?$/gu,
    argumentsAfter: 1,
    arguments: [
      {
        levelEnd: def.COMETES_ARREU.before(),
        refused: ['constant_string_quoted'],
        codeerror: 'hy-unnecessary-quotes',
      },
      {
        refused: ['call_function_void'],
        codeerror: 'hy-refused-function-void',
      },
      {
        refused: ['condition'],
        codeerror: 'hy-warn-storing-condition',
      },
    ],
  },
  {
    text: ',',
    name: 'comma',
    levelStart: def.CMD_COMMA.start,
    minArgumentsAfter: 1,
    concatOn: ['comma'],
  },
  {
    text: 'remove',
    levelStart: def.CMD_ADD_REMOVE.start,
    argumentsAfter: 3,
    atBegining: true,
  },
  {
    text: 'from',
    levelStart: def.CMD_ADD_REMOVE.start,
    hasBefore: /^remove [\p{L}_\d]+$/gu,
    argumentsAfter: 1,
  },
  {
    text: 'add',
    levelStart: def.CMD_ADD_REMOVE.start,
    argumentsAfter: 3,
    atBegining: true,
  },
  {
    text: 'to',
    name: 'to_list',
    levelStart: def.CMD_ADD_REMOVE.start,
    hasBefore: /^add [\p{L}_\d]+$/gu,
    argumentsAfter: 1,
  },
  {
    text: 'to',
    name: 'to_range',
    levelStart: def.CMD_RANGETO.start,
    levelEnd: def.CMD_RANGETO.end,
    argumentsAfter: 1,
    argumentsBefore: 1,
    arguments: [
      {
        allowed: ['$number_integer'],
        codeerror: 'hy-execting-number-integer',
      },
      {
        refused: ['math'],
        codeerror: 'hy-warn-math-operation-limit',
      },
    ],
    hasBefore: /\brange/g,
  },
  {
    text: 'at',
    levelStart: def.CMD_ATRANDOM.start,
    levelEnd: def.CMD_ATRANDOM.end,
    hasBefore: /[\p{L}_\d]+$/gu,
    hasAfter: /^ *\brandom\b/gu,
    argumentsAfter: 1,
  },
  {
    text: 'random',
    levelStart: def.CMD_RANDOM.start,
    levelEnd: def.CMD_RANDOM.end,
    syntax: [
      {
        levelEnd: def.CMD_ATRANDOM.end,
        argumentsAfter: 0,
        hasBefore: /at\b/gu,
      },
      {
        levelStart: def.CMD_ATRANDOM.after(),
        hasBefore: /\[ */gu,
        hasAfter: / *\]/gu,
        argumentsAfter: 1,
      },
    ],
  },
  {
    text: 'if',
    levelStart: def.CMD_IF_ELSE.start,
    atBegining: true,
    argumentsAfter: 1,
    syntax: [
      {
        closedBy: 'colon',
        levelStart: def.COLON.start,
      },
    ],
    arguments: [
      {
        allowed: ['condition'],
        codeerror: 'hy-execting-condition',
      },
    ],
  },
  {
    text: 'else',
    levelStart: def.CMD_IF_ELSE.start,
    atBegining: true,
    argumentsAfter: 0,
    syntax: [
      {
        closedBy: 'colon',
        levelStart: def.COLON.start,
      },
    ],
  },
  {
    text: 'pressed',
    levelStart: def.CMD_ISPRESSED.start,
    argumentsAfter: 0,
    hasBefore: /^if .*is/g,
  },
  {
    text: 'not',
    levelStart: def.CMD_NOT.start,
    hasBefore: /^if .*/g,
    hasAfter: /\bin\b/g,
  },
  {
    text: 'in',
    levelStart: def.CMD_IN.start,
    hasBefore: /^(if|elif|for) .*/g,
    argumentsAfter: 1,
  },
  {
    text: '+',
    name: 'sum',
    levelStart: def.MATES.start,
    argumentsAfter: 1,
    argumentsBefore: 1,
    concatOn: ['sum', 'rest', 'multiplication', 'division'],
    arguments: [
      {
        levelEnd: def.COMETES_ARREU.before(),
        allowed: ['$number'],
        codeerror: 'hy-execting-number',
      },
      {
        levelEnd: def.COMETES_ARREU.start,
        allowed: ['$number', '$quoted'],
        codeerror: 'hy-execting-number-string',
      },
      {
        refused: ['call_function_return'],
        codeerror: 'hy-warn-function-return-operation',
      },
      {
        refused: ['call_at_random'],
        codeerror: 'hy-warn-random-operation',
      },
    ],
  },
  {
    text: '-',
    name: 'rest',
    ...operationTemplate,
  },
  {
    text: '*',
    name: 'multiplication',
    ...operationTemplate,
  },
  {
    text: '/',
    name: 'division',
    ...operationTemplate,
  },
  {
    text: 'repeat',
    atBegining: true,
    argumentsAfter: 2,
    levelStart: def.CMD_REPEAT.start,
    arguments: [
      {
        allowed: ['$number_integer'],
        position: 1,
        codeerror: 'hy-execting-number-integer',
      },
      {
        allowed: ['command_times'],
        position: 2,
        codeerror: 'hy-execting-command-times',
      },
    ],
    syntax: [
      {
        closedBy: 'colon',
        levelStart: def.COLON.start,
      },
    ],
  },
  {
    text: 'times',
    levelStart: def.CMD_REPEAT.start,
    hasBefore: /^repeat [\p{L}_\d]+/gu,
    argumentsAfter: 0,
  },
  {
    text: 'for',
    atBegining: true,
    levelStart: def.CMD_FOR.start,
    argumentsAfter: 1,
    arguments: [
      {
        allowed: ['condition'],
        codeerror: 'hy-execting-condition',
      },
    ],
    syntax: [
      {
        closedBy: 'colon',
        levelStart: def.COLON.start,
      },
    ],
  },
  {
    text: 'range',
    levelStart: def.CMD_RANGE_BRACED.start,
    hasBefore: /^for .* in$/g,
    argumentsAfter: 3,
  },
  {
    text: 'define',
    levelStart: def.FUNCTIONS_DEFINE_CALL.start,
    atBegining: true,
    minArgumentsAfter: 1,
    arguments: [
      {
        refused: ['constant'],
        codeerror: 'hy-execting-parameter',
      },
      {
        allowed: ['entity_function', 'entity_parameter', 'command_with', 'command_comma_argument'],
        codeerror: 'hy-execting-function-definition',
      },
    ],
    syntax: [
      {
        closedBy: 'colon',
        levelStart: def.COLON.start,
      },
    ],
  },
  {
    text: 'def',
    levelStart: def.FUNCTIONS_PYTHON.start,
    levelEnd: def.FUNCTIONS_PYTHON.end,
    atBegining: true,
    minArgumentsAfter: 1,
    arguments: [
      {
        refused: ['constant'],
        codeerror: 'hy-execting-parameter',
      },
      {
        allowed: ['entity_function', 'entity_parameter', 'command_with', 'command_comma_argument'],
        codeerror: 'hy-execting-function-definition',
      },
    ],
    syntax: [
      {
        closedBy: 'colon',
        levelStart: def.COLON.start,
      },
    ],
  },
  {
    text: 'call',
    levelStart: def.FUNCTIONS_DEFINE_CALL.start,
    levelEnd: def.FUNCTIONS_DEFINE_CALL.end,
    atBegining: false,
    usesParameters: true,
    minArgumentsAfter: 1,
    arguments: [
      {
        allowed: ['entity_function'],
        codeerror: 'hy-execting-function-call',
      },
    ],
  },
  {
    text: 'with',
    levelStart: def.FUNCTIONS_WITH.start,
    hasBefore: /(^define|\bcall) +/g,
    minArgumentsAfter: 1,
  },
  {
    text: 'and',
    levelStart: def.CMD_AND_OR.start,
    minArgumentsAfter: 1,
    argumentsBefore: 1,
    concatOn: ['and', 'or'],
    hasBefore: /^(if|elif|while) .*/g,
    arguments: [
      {
        allowed: ['condition'],
        codeerror: 'hy-execting-condition',
      },
    ],
  },
  {
    text: 'or',
    levelStart: def.CMD_AND_OR.start,
    minArgumentsAfter: 1,
    argumentsBefore: 1,
    concatOn: ['and', 'or'],
    hasBefore: /^(if|elif|while) .*/g,
    arguments: [
      {
        allowed: ['condition'],
        codeerror: 'hy-execting-condition',
      },
    ],
  },
  {
    text: 'return',
    levelStart: def.RETURN_FUNCTION.start,
    atBegining: true,
    argumentsAfter: 1,
  },
  {
    text: '>',
    name: 'greater_than',
    levelStart: def.COMPARE_OPERATORS.start,
    argumentsAfter: 1,
    argumentsBefore: 1,
    arguments: [
      {
        allowed: ['$number'],
        codeerror: 'hy-execting-number',
      },
      {
        refused: ['math'],
        codeerror: 'hy-warn-math-operation-compare',
      },
      {
        refused: ['call_function_return'],
        codeerror: 'hy-warn-function-return-operation',
      },
      {
        refused: ['call_at_random'],
        codeerror: 'hy-warn-random-operation',
      },
    ],
  },
  {
    text: '<',
    name: 'less_than',
    levelStart: def.COMPARE_OPERATORS.start,
    argumentsAfter: 1,
    argumentsBefore: 1,
    arguments: [
      {
        allowed: ['$number'],
        codeerror: 'hy-execting-number',
      },
      {
        refused: ['math'],
        codeerror: 'hy-warn-math-operation-compare',
      },
      {
        refused: ['call_function_return'],
        codeerror: 'hy-warn-function-return-operation',
      },
      {
        refused: ['call_at_random'],
        codeerror: 'hy-warn-random-operation',
      },
    ],
  },
  {
    text: '>=',
    name: 'greater_than_or_equal',
    levelStart: def.COMPARE_OPERATORS.start,
    argumentsAfter: 1,
    argumentsBefore: 1,
    arguments: [
      {
        allowed: ['$number'],
        codeerror: 'hy-execting-number',
      },
      {
        refused: ['math'],
        codeerror: 'hy-warn-math-operation-compare',
      },
      {
        refused: ['call_function_return'],
        codeerror: 'hy-warn-function-return-operation',
      },
      {
        refused: ['call_at_random'],
        codeerror: 'hy-warn-random-operation',
      },
    ],
  },
  {
    text: '<=',
    name: 'less_than_or_equal',
    levelStart: def.COMPARE_OPERATORS.start,
    argumentsAfter: 1,
    argumentsBefore: 1,
    arguments: [
      {
        allowed: ['$number'],
        codeerror: 'hy-execting-number',
      },
      {
        refused: ['math'],
        codeerror: 'hy-warn-math-operation-compare',
      },
      {
        refused: ['call_function_return'],
        codeerror: 'hy-warn-function-return-operation',
      },
      {
        refused: ['call_at_random'],
        codeerror: 'hy-warn-random-operation',
      },
    ],
  },
  {
    text: '==',
    name: 'compare_equalequal',
    levelStart: def.COMPARE_OPERATORS.start,
    argumentsAfter: 1,
    argumentsBefore: 1,
    arguments: [
      {
        levelEnd: def.COMETES_ARREU.start,
        allowed: ['$number', '$quoted', '$boolean'],
        codeerror: 'hy-execting-number-string',
      },
      {
        refused: ['math'],
        codeerror: 'hy-warn-math-operation-compare',
      },
      {
        refused: ['call_function_return'],
        codeerror: 'hy-warn-function-return-operation',
      },
      {
        refused: ['call_at_random'],
        codeerror: 'hy-warn-random-operation',
      },
    ],
  },
  {
    text: '!=',
    name: 'not_equal',
    levelStart: def.COMPARE_OPERATORS.start,
    argumentsAfter: 1,
    argumentsBefore: 1,
    arguments: [
      {
        levelEnd: def.COMETES_ARREU.start,
        allowed: ['$number', '$quoted', '$boolean'],
        refused: ['call'],
        codeerror: 'hy-execting-number-string',
      },
      {
        refused: ['math'],
        codeerror: 'hy-warn-math-operation-compare',
      },
      {
        refused: ['call_function_return'],
        codeerror: 'hy-warn-function-return-operation',
      },
      {
        refused: ['call_at_random'],
        codeerror: 'hy-warn-random-operation',
      },
    ],
  },
  {
    text: 'while',
    levelStart: def.CMD_WHILE.start,
    atBegining: true,
    argumentsAfter: 1,
    arguments: [
      {
        allowed: ['condition'],
        codeerror: 'hy-execting-condition',
      },
    ],
    syntax: [
      {
        closedBy: 'colon',
        levelStart: def.COLON.start,
      },
    ],
  },
  {
    text: '[]',
    name: 'list_empty',
    levelStart: def.BRACED_LIST.start,
  },
  {
    text: '[',
    name: 'bracket_open_access',
    levelStart: def.BRACED_LIST.start,
    argumentsAfter: 1,
    closedBy: 'bracket_close',
    hasBefore: /[\p{L}_\d]+ *(?<!\bis)$/gu,
    arguments: [
      {
        allowed: ['$number_integer', 'command_bracket_close', 'command_random'],
        codeerror: 'hy-list-access-types',
      },
      {
        allowed: ['command_bracket_close'],
        position: 2,
        codeerror: 'hy-access-brackets-format-arguments',
      },
    ],
  },
  {
    text: '[',
    name: 'bracket_open_definition',
    levelStart: def.BRACED_LIST.start,
    argumentsAfter: 1,
    concatOn: ['comma'],
    closedBy: 'bracket_close',
    arguments: [
      {
        allowed: ['constant', 'command_comma', 'command_bracket_close'],
        codeerror: 'hy-list-definition-types',
      },
    ],
  },

  {
    text: '(',
    name: 'parenthesis_open',
    levelStart: def.PARENTHESES.start,
  },
  {
    text: ')',
    name: 'parenthesis_close',
    levelStart: def.PARENTHESES.start,
    minArgumentsBefore: 1,
  },
  {
    text: ']',
    name: 'bracket_close',
    levelStart: def.BRACED_LIST.start,
    minArgumentsBefore: 1,
  },
  {
    text: 'elif',
    levelStart: def.CMD_ELIF.start,
    atBegining: true,
    argumentsAfter: 1,
    arguments: [
      {
        allowed: ['condition'],
        codeerror: 'hy-execting-condition',
      },
    ],
    syntax: [
      {
        closedBy: 'colon',
        levelStart: def.COLON.start,
      },
    ],
  },
  {
    text: ':',
    name: 'colon',
    levelStart: def.COLON.start,
    argumentsAfter: 0,
  },
]

export default commandDefinition
