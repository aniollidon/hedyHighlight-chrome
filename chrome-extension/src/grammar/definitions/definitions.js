const HIGHER_LEVEL = 16
const NOT_DEFINED_LEVEL = 99

class OnLevel {
  constructor(from, to = HIGHER_LEVEL) {
    this.start = from
    this.end = to
  }

  // Static constructor
  static deprecated() {
    return new OnLevel(NOT_DEFINED_LEVEL, NOT_DEFINED_LEVEL)
  }

  at(level) {
    if (this.end === undefined) {
      return level >= this.start
    } else {
      return level >= this.start && level <= this.end
    }
  }

  inactive(level) {
    return !this.at(level)
  }

  before() {
    return this.start - 1
  }

  after() {
    return this.end + 1
  }
}

export const COMETES_TEXTOS = new OnLevel(4)
export const COMETES_ARREU = new OnLevel(12)
export const COLON = new OnLevel(13)
export const PARENTHESES = new OnLevel(13)

export const CONDITIONAL_INLINE = new OnLevel(5, 5)
export const CONDITIONAL_INLINE_WARN = new OnLevel(6)
export const LOOP_INLINE = new OnLevel(8, 8)
export const LOOP_INLINE_WARN = new OnLevel(9)

export const USES_SCOPE = new OnLevel(9)
export const SCOPE_RECURSIVE = new OnLevel(10)

export const MATES = new OnLevel(7)
export const NUMBERS = MATES
export const DECIMALS = MATES
export const PRINT_DECIMALS = new OnLevel(13)

export const NOBRACED_LISTS = new OnLevel(3, 12)
export const BRACED_LIST = new OnLevel(13)
export const BOOLEANS = new OnLevel(13)
export const PRINT_BOOLEANS = new OnLevel(15)

export const FUNCIONS = new OnLevel(12)
export const FUNCTIONS_PYTHON = new OnLevel(13)
export const FUNCTIONS_DEFINE_CALL = new OnLevel(FUNCIONS.start, FUNCTIONS_PYTHON.before())
export const FUNCTIONS_WITH = OnLevel.deprecated() // DEPRECATED NO USAR
export const RETURN_FUNCTION = FUNCTIONS_PYTHON

export const PRINT_LIST = new OnLevel(13)
export const COMPARE_OPERATORS = new OnLevel(13)

export const CMD_TURN_LEFTRIGHT = new OnLevel(1, 1)
export const CMD_TURN_ANGLE = new OnLevel(2)
export const CMD_SLEEP = new OnLevel(2)
export const CMD_ASK_NOIS = new OnLevel(1, 1)
export const CMD_ECHO = new OnLevel(1, 1)
export const CMD_ASK_IS = new OnLevel(2) // Es depreca al 13
export const CMD_COMMA = new OnLevel(3)
export const CMD_INPUT = new OnLevel(13)
export const CMD_IS = new OnLevel(2)
export const CMD_EQUAL = MATES
export const CMD_EQUALIGUAL = COMPARE_OPERATORS

export const CMD_ADD_REMOVE = new OnLevel(3)
export const CMD_RANDOM = new OnLevel(3)
export const CMD_ATRANDOM = new OnLevel(CMD_RANDOM.start, 12)
export const CMD_CLEAR = new OnLevel(4)
export const CMD_REPEAT = new OnLevel(7)
export const CMD_FOR = new OnLevel(11)
export const CMD_WHILE = new OnLevel(13)
export const CMD_IF_ELSE = new OnLevel(5)
export const CMD_ISPRESSED = new OnLevel(6)
export const CMD_ELIF = new OnLevel(6)
export const CMD_IN = new OnLevel(6)
export const CMD_AND_OR = new OnLevel(10)
export const CMD_PRESSED = new OnLevel(6)
export const CMD_NOT = new OnLevel(6)
export const CMD_RANGETO = OnLevel.deprecated() // DEPRECATED NO USAR
export const CMD_RANGE_BRACED = new OnLevel(13)
