/* Funció auxiliar per clonar un objecte.
 * S'utilitza per evitar problemes de referències compartides.
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/* Funció auxiliar per comparar una regla amb un valor.
   Una regla pot tenir diferents formats:
    - Un valor simple: es compara directament
    - Un array de valors: es comprova si el valor està dins l'array
    - un dict amb condicions més complexes. (after / before)
  Retorna true si compleix la regla, false en cas contrari.
*/
export function compare(rule, value) {
  if (rule === undefined) return true
  if (Array.isArray(rule)) {
    return rule.includes(value)
  } else if (typeof rule === 'object') {
    if (rule.after !== undefined) return value > rule.after
    if (rule.before !== undefined) return value < rule.before
    return true
  } else {
    return rule === value
  }
}

export function entreCometes(text, pos) {
  let contasimple = 0
  let contaDoble = 0

  for (let i = 0; i < pos; i++) {
    if (contasimple % 2 === 0 && text[i] === '"') contaDoble++

    if (contaDoble % 2 === 0 && text[i] === "'") contasimple++
  }

  if (contasimple % 2 === 1 || contaDoble % 2 === 1) return true

  return false
}

export function cleanCometes(text) {
  return text.replace(/^['"]|['"]$/g, '')
}
export function separarParaules(codiTrim, identationLength) {
  /*
   * Regex per tokenitzar codi Hedy en paraules, strings, emojis, números i símbols.
   *
   * La regex té 6 grups de captura, processats per ordre de prioritat:
   *
   * 1. '([^']*)'  - Strings amb cometes simples (captura el contingut sense les cometes)
   * 2. "([^"]*)"  - Strings amb cometes dobles (captura el contingut sense les cometes)
   *
   * 3. ((?:[\p{Extended_Pictographic}][\uFE0F\u20E3]*)+)  - Emojis
   *    - \p{Extended_Pictographic}: emojis base (🍉, ❤, 😎...) - NO inclou * ni # ni dígits
   *    - \uFE0F: variation selector per emojis amb color (❤️ = ❤ + FE0F)
   *    - \u20E3: combining enclosing keycap per keycaps (7️⃣ = 7 + FE0F + 20E3)
   *    - El + final permet seqüències d'emojis consecutius
   *
   * 4. ([\p{L}\p{M}_\d.]+)  - Paraules/identificadors
   *    - \p{L}: qualsevol lletra Unicode (inclou accents, ciríl·lic, etc.)
   *    - \p{M}: marks combinants (accents, diacrítics)
   *    - _: subratllat (per noms de variables)
   *    - \d: dígits (per noms com "var1")
   *    - .: punt (per números decimals dins paraules)
   *
   * 5. (\d+\.\d+|\d+)  - Números (decimals o enters)
   *
   * 6. ([^\p{L}\p{Extended_Pictographic}\d\s.'"]+)  - Símbols i operadors
   *    - Tot el que NO sigui: lletres, emojis, dígits, espais, punt, cometes
   *    - Captura: + - * / = < > [ ] ( ) : , etc.
   *
   * Flags:
   *   g - global (trobar totes les coincidències)
   *   u - unicode (necessari per \p{...})
   */
  const regex =
    /'([^']*)'|"([^"]*)"|((?:[\p{Extended_Pictographic}][\uFE0F\u20E3]*)+)|([\p{L}\p{M}_\d.!]+)|(\d+\.\d+|\d+)|([^\p{L}\p{Extended_Pictographic}\d\s.'"]+)/gu
  let paraules = []
  let match

  while ((match = regex.exec(codiTrim)) !== null) {
    const [_, cometesSimples, cometesDobles, emoji, paraula, numero, simbols] = match
    let posicio = match.index + identationLength // Posició inicial de la coincidència

    if (cometesSimples !== undefined) {
      paraules.push({ text: `'${cometesSimples}'`, pos: posicio }) // Text entre cometes simples
    } else if (cometesDobles !== undefined) {
      paraules.push({ text: `"${cometesDobles}"`, pos: posicio }) // Text entre cometes dobles
    } else if (emoji !== undefined) {
      paraules.push({ text: emoji, pos: posicio }) // Emojis
    } else if (paraula !== undefined) {
      paraules.push({ text: paraula, pos: posicio }) // Paraules normals amb lletres, dígits o subratllat
    } else if (numero !== undefined) {
      paraules.push({ text: numero, pos: posicio }) // Números enters o decimals
    } else if (simbols !== undefined) {
      // Si els símbols inclouen [ ] : + - * / ( ), separa'ls individualment
      const simbolsSeparats = simbols.split(/([\[\]:+\-*/()])/).filter(Boolean)
      simbolsSeparats.forEach(simbol => {
        paraules.push({ text: simbol, pos: posicio })
        posicio += simbol.length
      })
    }
  }

  return paraules
}

export function identation(line) {
  const identation = line.match(/^[\t ]+/g)
  const identationLength = identation !== null ? identation[0].length : 0
  return identationLength
}

/* Donat un text i una posció desplaça la posició fins que troba un caràcter que no sigui un espai o tabulador */
export function trimPosStart(text, start) {
  let pos = start
  while (text[pos] === ' ' || text[pos] === '\t') {
    pos++
  }
  return pos
}

/* Donat un text i una posció desplaça la posició fins que troba un caràcter que no sigui un espai o tabulador */
export function trimPosEnd(text, end) {
  let pos = end
  while (text[pos - 1] === ' ' || text[pos - 1] === '\t') {
    pos--
  }
  return pos
}
