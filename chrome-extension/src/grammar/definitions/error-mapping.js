/*
  Plantilla per definir el mapping d'errors:
  + codeerror: Codi de l'error original (obligatori)
  + map: Array amb els mappings
    + codeerror: Codi de l'error nou (obligatori)
    + levelStart: Nivell on comença el mapping [inclusiu] (default =1)
    + levelEnd: Nivell on acaba el mapping [inclusiu] (default =17)
    + hasBefore: RegExp que ha de tenir la paraula posterior al tag/commanda on es vol aplicar l'error (default = NO CHECK)
    + hasAfter: RegExp que ha de tenir la paraula anterior al tag/commanda es vol aplicar l'error (default = NO CHECK)
    + command: Comanda on es vol aplicar l'error (default = NO CHECK)
    + tag: Tag on es vol aplicar l'error (default = NO CHECK)
*/

const errorMapping = [
    {
        codeerror: 'hy-command-missing-argument',
        map: [
            {
                command: 'ask',
                levelEnd: 1,
                codeerror: 'hy-text-must-be-quoted',
            },
            {
                command: 'echo',
                levelEnd: 1,
                codeerror: 'hy-text-must-be-quoted',
            },
        ],
    },
    {
        codeerror: 'hy-lines-must-start-with',
        map: [
            {
                hasAfter: /^ask/g,
                codeerror: 'hy-ask-not-in-definition',
            },
        ],
    },
]

export default errorMapping
