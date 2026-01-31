const errorMapping = [
  {
    codeerror: 'hy-command-unexpected-argument',
    on: ['if', 'elif', 'while', 'for'],
    to: 'hy-command-unexpected-argument-conditional',
  },
  {
    codeerror: 'hy-command-unexpected-argument',
    on: ['is', '='], // TODO hauria de ser definition_equal i definition_is
    to: 'hy-definition-unexpected-argument',
  },
  {
    codeerror: 'hy-command-unexpected-argument',
    on: ['['], // TODO hauria de ser bracket_open_access
    to: 'hy-list-extra-element',
  },
  {
    //DEPRECAR?¿
    codeerror: 'hy-command-missing-argument',
    on: [','], // TODO hauria de ser comma_list
    to: 'hy-command-missing-argument-comma',
  },
  {
    codeerror: 'hy-command-context',
    on: ['ask'],
    to: 'hy-ask-not-in-definition',
  },
  {
    codeerror: 'hy-level-unavailable-yet',
    on: ['random'],
    to: 'hy-random-usage',
  },
  {
    codeerror: 'hy-expecting-close',
    on: ['['], // TODO hauria de ser bracket_open_access
    to: 'hy-bracket-open-needs-close',
  },

  {
    codeerror: 'hy-expecting-close',
    on: ['('], // TODO hauria de ser bracket_open_access
    to: 'hy-parenthesis-open-needs-close',
  },
  {
    codeerror: 'hy-expecting-close',
    on: ['if', 'else', 'elif', 'while', 'for'],
    to: 'hy-missing-colon',
  },
  {
    codeerror: 'hy-refused-command-for-print',
    on: ['(', ')'], // TODO hauria de ser parenthesis_open/close
    to: 'hy-unnecessary-parentheses',
  },
  {
    codeerror: 'hy-refused-command-for-print',
    on: [','], // TODO hauria de ser comma
    to: 'hy-unnecessary-comma',
  },
  {
    codeerror: 'hy-level-unavailable-yet',
    on: [':'], // TODO hauria de ser colon
    to: 'hy-unnecessary-colon',
  },
]

export { errorMapping }
