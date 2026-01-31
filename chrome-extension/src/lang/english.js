const texts = {
  reloading: 'The extension hedy-highlighting is being reload...',
  copilot_disable_question: 'Do you want to disable GitHub Copilot for Hedy files?',
  copilot_disabled: 'GitHub Copilot disabled for Hedy files',
  copilot_error: 'Error configuring GitHub Copilot: ',
  yes: 'Yes',
  no: 'No',
}

const colors = ['black', 'blue', 'brown', 'gray', 'green', 'orange', 'pink', 'purple', 'red', 'white', 'yellow']

const commands = {
  compare_is: 'is (comparison)',
  variable_define_is: 'is (variable definition)',
  comma: 'comma',
  to_list: 'to (list)',
  to_range: 'to (after range)',
  compare_equal: 'equal (comparison)',
  variable_define_equal: 'equal (variable definition)',
  sum: 'addition (+)',
  rest: 'subtraction (-)',
  multiplication: 'multiplication (*)',
  division: 'division (/)',
  comma_argument: 'comma (argument separator)',
  greater_than: 'greater than (>)',
  less_than: 'less than (<)',
  greater_than_or_equal: 'greater than or equal (>=)',
  less_than_or_equal: 'less than or equal (<=)',
  compare_equalequal: 'equal (==)',
  not_equal: 'not equal (!=)',
  parenthesis_open: "open parenthesis '('",
  parenthesis_close: "closed parenthesis ')'",
}

const errors = {
  'hy-command-context': {
    message: "'[COMMAND]' command cannot be used this way.",
  },
  'hy-type-context': {
    message: "The text '[COMMAND]' which is [TYPE] cannot be used this way.",
  },
  'hy-recomended-equal': {
    message: "It is recommended to use '=' instead of 'is'.",
  },
  'hy-lines-must-start-with': {
    message: 'Lines must start with a command or a definition.',
  },
  'hy-text-must-be-quoted': {
    message: 'This text should be in quotes. Maybe it is a misspelled variable?',
  },
  'hy-recomended-equalequal': {
    message: "At this level you can use '==' instead of '[COMMAND]'.",
  },
  'hy-entity-changes-content-type': {
    message: "Be careful, variable '[NAME]' has changed its type compared to its definition on line [LINEDEF].",
  },
  'hy-at-begining': {
    message: "'[COMMAND]' command must be at the beginning.",
  },
  'hy-command-missing-argument': {
    message: "'[COMMAND]' command needs at least one argument after.",
    messagePlural: "'[COMMAND]' command needs [VALUE] arguments after.",
    messageZero: "'[COMMAND]' command doesn't need arguments.",
  },
  'hy-command-missing-argument-before': {
    message: "'[COMMAND]' command needs an argument before.",
    messagePlural: "'[COMMAND]' command needs [VALUE] arguments before.",
    messageZero: "'[COMMAND]' command doesn't need arguments before.",
  },
  'hy-command-unexpected-argument': {
    message: "'[COMMAND]' command only accepts one argument after.",
    messagePlural: "'[COMMAND]' command only accepts [VALUE] arguments after.",
    messageZero: "'[COMMAND]' command doesn't accept any value after.",
  },
  'hy-definition-unexpected-argument': {
    message:
      'In a variable definition only one element is accepted. If you want a list, separate the elements with commas.',
  },
  'hy-command-unexpected-argument-conditional': {
    message: "'[COMMAND]' command only accepts one condition after.",
  },
  'hy-execting-function-definition': {
    message:
      "A function definition is expected. The correct format is 'define <name>' or above level 13 'define <name> with <arg1>, <arg2> <...>'.",
  },
  'hy-execting-function-call': {
    message: "A call to an existing function name is expected after '[NAME]'.",
  },
  'hy-command-missing-argument-comma': {
    message: 'After a comma there must be an element.',
  },
  'hy-level-unavailable-yet': {
    message: "'[COMMAND]' command cannot be used at this level yet.",
  },
  'hy-level-unavailable-deprecated': {
    message: "'[COMMAND]' command can no longer be used at this level.",
  },
  'hy-to-lowercase-command': {
    message: "Are you searching for '[LOWER]' command? If so, it must be all lowercase.",
  },
  'hy-entity-out-of-scope': {
    message:
      "The '[NAME]' variable is being used outside its indentation block and may not exist. The variable was defined on line [LINEDEF], which is outside the current block.",
  },
  'hy-always-false': {
    message: 'The condition is always false and never satisfied.',
  },
  'hy-always-true': {
    message: 'The condition is always true and always satisfied.',
  },
  'hy-same-comparison-true': {
    message: 'It does not make much sense to compare the same thing twice. It will always be true.',
  },
  'hy-same-comparison-false': {
    message: 'It does not make much sense to compare the same thing twice. It will always be false.',
  },
  'hy-execting-same-type': {
    message: "'[COMMAND]' command expects the same type before and after.",
  },
  'hy-execting-number': {
    message: "'[COMMAND]' command expects a number. [TYPE] was found.",
  },
  'hy-execting-number-integer': {
    message: "'[COMMAND]' command expects an integer number. [TYPE] was found.",
  },
  'hy-execting-command-times': {
    message:
      "'[COMMAND]' command expects an integer number and then 'times' command. [TYPE] was found in the second position.",
  },
  'hy-execting-number-string': {
    message: "'[COMMAND]' command expects numbers or text. '[NAME]' which is [TYPE] was found.",
  },
  'hy-execting-number-note': {
    message: "'[COMMAND]' command expects a note or a number. '[NAME]' which is [TYPE] was found.",
  },
  'hy-execting-color': {
    message: "'[COMMAND]' command expects a color. '[NAME]' which is [TYPE] was found.",
  },
  'hy-execting-condition': {
    message: "'[COMMAND]' command expects a condition after it. [TYPE] was found.",
  },
  'hy-use-elseif-instead': {
    message: "Instead of 'else if' you should use 'elif' command.",
  },
  'hy-after-needs-list': {
    message: "A list is expected after '[COMMAND]'.",
  },
  'hy-before-needs-list': {
    message: "A list is expected before '[COMMAND]'.",
  },
  'hy-after-needs-nolist': {
    message: "Lists are not allowed after '[COMMAND]'.",
  },
  'hy-before-needs-nolist': {
    message: "Lists are not allowed before '[COMMAND]'.",
  },
  'hy-cant-print-list': {
    message: 'Lists cannot be printed directly.',
  },
  'hy-softwarn-print-list': {
    message: 'Do you want to print a list? Perhaps you wanted to print an element of the list?',
  },
  'hy-cant-print-function': {
    message: 'Functions cannot be printed directly. Use the "call" command instead.',
  },
  'hy-add-remove-notlist': {
    message:
      "The correct format is 'add <item> to <list>' or 'remove <item> from <list>'. An item was expected but a list was found.",
  },
  'hy-pressed-must-be-second': {
    message: "'[COMMAND]' command must be at the second position, after 'is'.",
  },
  'hy-turn-left-right': {
    message: "'[COMMAND]' command only accepts 'left' or 'right' at this level.",
  },
  'hy-variabledef-multiplewords': {
    message: 'To define a variable you can only use one word.',
  },
  'hy-not-decimals': {
    message: 'At this level decimals are not yet allowed.',
  },
  'hy-not-print-decimals': {
    message: 'Decimals cannot be printed at this level, put quotes around it and it will be text.',
  },
  'hy-not-numbers': {
    message: 'At this level numbers are not yet allowed. Put quotes around it and it will be text.',
  },
  'hy-else-elif-needs-if': {
    message: "'[COMMAND]' command expects that 'if' has been used previously.",
  },
  'hy-blanks-not-allowed': {
    message: 'Blank spaces must be filled with code!',
  },
  'hy-identation-not-expected': {
    message: 'The indentation is not correct. Only after a loop or condition should you indent.',
  },
  'hy-identation-not-expected-yet': {
    message: 'There is a space before the line that should not be there. Remove it.',
  },
  'hy-identation-large': {
    message: 'The indentation is too large. Add only [EXPECTED] extra spaces compared to the previous line.',
  },
  'hy-identation-small': {
    message: 'The indentation is too small. Add [EXPECTED] extra spaces compared to the previous line.',
  },
  'hy-identation-expected': {
    message:
      'An indentation was expected on this line but not found. Add [EXPECTED] extra spaces compared to the previous line.',
  },
  'hy-fileends-identation-expected': {
    message: 'A condition or loop was found without a subsequent indented code block.',
  },
  'hy-identation-multiple-unavailable': {
    message:
      'At this level you cannot define a loop/condition inside another loop/condition yet. Only independent loops/conditions are allowed.',
  },
  'hy-identation-misalignment': {
    message:
      'You must be consistent with indentation. Until now you were using [EXPECTED] spaces to indent but on this line there are [FOUND]. The spaces used must be a multiple of [EXPECTED].',
  },
  'hy-unnecessary-quotes': {
    message: 'At this level, quotes are not yet required for this text.',
  },
  'hy-entitydef-starts-with-number': {
    message: 'Variable names cannot start with a number.',
  },
  'hy-function-argument-duplicated': {
    message: 'When defining a function, you cannot repeat arguments or use the name of the function itself.',
  },
  'hy-function-missing-argument': {
    message: "The function '[NAME]' expects [EXPECTED] arguments, [FOUND] were found.",
  },
  'hy-function-unexpected-argument': {
    message: "The function '[NAME]' only expects [VALUE] arguments.",
  },
  'hy-ask-not-in-definition': {
    message: "The command 'ask' must be inside a variable definition.",
  },
  'hy-pressed-needs-is': {
    message: "'[COMMAND]' command doesn't work with '=', it only works with 'is' before it.",
  },
  'hy-execting-parameter': {
    message: 'In a function definition, a valid parameter name is expected. [TYPE] was found.',
  },
  'hy-refused-function-void': {
    message: 'This function does not return anything, it can only be called alone.',
  },
  'hy-warn-function-return-operation': {
    message:
      "Currently you cannot operate with function calls, it's a good idea, but not yet possible. Save the result in a variable.",
  },
  'hy-warn-storing-condition': {
    message: "Currently you cannot store conditions, it's a good idea, but not yet possible.",
  },
  'hy-warn-math-operation-compare': {
    message:
      "Currently you cannot compare mathematical operations, it's a good idea, but not yet possible. Save the result in a variable.",
  },
  'hy-warn-math-operation-limit': {
    message:
      "Currently you cannot limit with mathematical operations, it's a good idea, but not yet possible. Save the result in a variable.",
  },
  'hy-warn-random-operation': {
    message:
      "Currently you cannot perform operations with the result of 'at random', it's a good idea, but not yet possible. Save the result in a variable.",
  },
  'hy-warn-access-set-operation': {
    message:
      "Currently you cannot directly store an operation in a position of the list, it's a good idea, but not yet possible. Save the result in a variable and store it later.",
  },
  'hy-random-usage': {
    message: "The command 'random' expects the command 'at' before it.",
  },
  'hy-comma-list-needs-brackets': {
    message:
      'It seems you are trying to define a list without brackets. Remember that lists must be surrounded by brackets.',
  },
  'hy-list-open-needs-close': {
    message: 'Missing closing bracket for the list.',
  },
  'hy-parenthesis-open-needs-close': {
    message: 'Missing closing parenthesis.',
  },
  'hy-function-return-unused': {
    message: 'This function returns a value that is not being saved in any variable.',
  },
  'hy-list-definition-types': {
    message: 'Only constant values are accepted in a list definition. [TYPE] was found.',
  },
  'hy-list-access-types': {
    message: 'You can only access lists with integer numbers or variables. [TYPE] was found.',
  },
  'hy-bracket-needs-before-list': {
    message: 'Before a bracket access there must be a list.',
  },
  'hy-access-brackets-format-arguments': {
    message: "In list access by bracket, you must follow the format 'list[num]', where there is only one access value.",
  },
  'hy-definition-wrong-format': {
    message:
      'The definition is not correct, multiple words were found, if they are a list they must be separated by commas',
  },
  'hy-bad-definition-for-is': {
    message: "The definition of 'for' needs an 'in' instead of 'is'.",
  },
  'hy-bracket-open-needs-close': {
    message: "'[COMMAND]' command expects the bracket to be closed.",
  },
  'hy-expecting-close': {
    message: "'[COMMAND]' command expects [TYPE] at the end of the line.",
  },
  'hy-not-expecting-coma-final': {
    message: 'There cannot be an alone comma at the end',
  },
  'hy-missing-colon': {
    message: "'[COMMAND]' command expects ':' at the end of the line.",
  },
  'hy-refused-command-for-print': {
    message: 'This command cannot be printed directly.',
  },
  'hy-warn-or-and-exclusive-condition': {
    message:
      "Currently you cannot use 'or' and 'and' in the same condition, it's a good idea, but not yet possible. You could use another 'if' instead.",
  },
  'hy-string-must-end-with-quotes': {
    message: 'Quotes have been opened but not closed.',
  },
  'hy-command-entity-conflict': {
    message:
      "The name '[NAME]' is used by both a command and an entity. Consider renaming the entity to avoid confusion.",
  },
  'hy-actions-must-be-in-next-sentence': {
    message: 'A line break must be made before the action.',
  },
  'hy-actions-must-be-in-same-sentence': {
    message: 'The action must be in the same sentence as the condition or loop. There cannot be a line break.',
  },
  'hy-entity-not-used': {
    message: "The [TYPE] '[NAME]' has been defined but is not being used anywhere.",
  },
  'hy-command-parenthesis-missing': {
    message: "The command '[COMMAND]' needs parentheses '()' for its arguments.",
  },
  'hy-execting-left-right': {
    message: "The command '[COMMAND]' only accepts 'left' or 'right' after it.",
  },
  'hy-list-extra-element': {
    message: 'Inside a list only elements separated by commas are allowed. An extra element without commas was found.',
  },
  'hy-unnecessary-parentheses': {
    message: 'Parentheses should not be used in this command.',
  },
  'hy-unnecessary-comma': {
    message: 'A comma is not necessary in this command.',
  },
  'hy-unnecessary-colon': {
    message: 'Colons are not necessary at this level. Remove them.',
  },
  'hy-recomended-input': {
    message: "It is recommended to use 'input' instead of 'ask'.",
  },
  'hy-recomended-def': {
    message: "It is recommended to use 'def' instead of 'define'.",
  },
  'hy-recomended-english-color-names': {
    message: 'It is recommended to use color names in English. THIS MESSAGE SHOULD NOT APPEAR IN ENGLISH.',
  },
}

export function command2text(command) {
  if (commands[command]) return commands[command]
  return command
}

export function type2text(type) {
  let tipus = ''
  if (type.startsWith('constant_number')) {
    if (type === 'constant_number_decimal') tipus = 'A decimal number'
    else tipus = 'An integer number'
  } else if (type.startsWith('constant_string_unquoted')) {
    tipus = 'An unquoted text'
  } else if (type.startsWith('constant_string_quoted')) {
    tipus = 'A text'
  } else if (type.startsWith('constant_color')) {
    tipus = 'A color'
  } else if (type.startsWith('constant_note')) {
    tipus = 'A note'
  } else if (type.startsWith('constant_boolean')) {
    tipus = 'A boolean value'
  } else if (type.startsWith('constant_blank')) {
    tipus = 'A blank space'
  } else if (type.startsWith('list_empty')) {
    tipus = 'An empty list'
  } else if (type.includes('list')) {
    tipus = 'A list'
  } else if (type.startsWith('tuple_empty')) {
    tipus = 'An empty parentheses'
  } else if (type.includes('tuple')) {
    tipus = 'A parentheses'
  } else if (type.startsWith('entity_function')) {
    tipus = 'A function name'
  } else if (type.startsWith('entity_parameter')) {
    tipus = 'A parameter'
  } else if (type.startsWith('entity_variable')) {
    tipus = 'A variable'
  } else if (type.startsWith('command')) {
    tipus = 'the command ' + command2text(type.replace('command_', ''))
  } else if (type.startsWith('call_function_return')) {
    tipus = 'A function call with return'
  } else if (type.startsWith('call_function_void')) {
    tipus = 'A function call without return'
  } else if (type.startsWith('call_ask')) {
    tipus = 'A question with ask'
  } else if (type.startsWith('call')) {
    tipus = 'A function call'
  } else if (type.startsWith('condition')) {
    let tt = type.replace('condition_command_', '')
    tipus = 'A condition ' + command2text(tt)
  } else if (type.startsWith('math')) {
    tipus = 'A mathematical operation'
  } else if (type.startsWith('braced_list')) {
    tipus = 'A list definition'
  } else tipus = 'A ' + type

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
