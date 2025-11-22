/*
  Plantilla per definir la sintaxi general:
  + levelStart: Nivell on comença la restricció [inclusiu] (default =1)
  + levelEnd: Nivell on acaba la restricció [inclusiu] (default =17)
  + allowed: Array amb els tags o grup de tags permesos (default = NO CHECK)
  + refused: Array amb els tags o grup de tags permesos (default = NO CHECK)
  + codeerror: Codi de l'error (obligatori)
  + position: Posició de l'argument a comprovar (default = NO CHECK)
  + atBegining: Si la restricció s'aplica al principi de la línia (default =false)
*/

const generalSyntax = [
    {
        atBegining: true,
        allowed: [
            'command',
            'entity_variable_value',
            'entity_variable_list',
            'call_function_void',
            'call_function_return',
            'call_ask',
            'call',
            'list_access',
            'constant_blank',
        ],
        codeerror: 'hy-lines-must-start-with',
    },
    {
        atBegining: true,
        levelStart: 16,
        allowed: ['list_access_bracket'],
        codeerror: 'hy-lines-must-start-with',
    },
    {
        refused: ['constant_string_unquoted'],
        levelStart: 4,
        codeerror: 'hy-text-must-be-quoted',
    },
    {
        refused: ['constant_blank'],
        codeerror: 'hy-blanks-not-allowed',
    },
]

export default generalSyntax
