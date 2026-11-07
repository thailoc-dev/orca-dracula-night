// Writes themes/*.json and terminal/*.json for Dracula Night, and refuses any color Orca would drop
// for low contrast. Usage: node scripts/build.mjs
//
// The syntax and terminal colors are Dracula's (https://draculatheme.com, MIT), with Dracula's
// own roles: pink keywords, green functions, cyan types, yellow strings, purple constants, orange
// parameters. The interface sits on a darker, bluer night background than Dracula's #282a36.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const ID = 'dracula-night'
const TITLE = 'Dracula Night'

const c = {
  // Night: the interface surfaces.
  background: '#1a1b2c',
  deep: '#141522',
  surface: '#222438',
  raised: '#2b2d45',
  selection: '#3a3d5c',
  border: '#2c2f48',
  // Dracula's palette.
  foreground: '#f8f8f2',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c6',
  purple: '#bd93f9',
  red: '#ff5555',
  yellow: '#f1fa8c'
}

// Each entry: scopes, color, font style.
const TOKEN_ROLES = [
  [['comment', 'punctuation.definition.comment'], 'comment', 'italic'],
  [['keyword', 'storage.type', 'storage.modifier', 'keyword.operator', 'keyword.control'], 'pink'],
  [['keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.logical.python'], 'pink', 'bold'],
  [['entity.name.function', 'support.function', 'meta.function-call.generic', 'variable.function'], 'green'],
  [['meta.decorator', 'entity.name.function.decorator', 'punctuation.decorator'], 'green', 'italic'],
  [['entity.name.type', 'entity.name.class', 'entity.name.namespace', 'support.type', 'support.class', 'entity.other.inherited-class'], 'cyan', 'italic'],
  [['variable.parameter', 'meta.parameter'], 'orange', 'italic'],
  [['string', 'punctuation.definition.string'], 'yellow'],
  [['string.regexp'], 'red'],
  [['constant.character.escape', 'constant.other.placeholder', 'punctuation.definition.template-expression', 'punctuation.section.embedded'], 'pink'],
  [['constant.numeric', 'constant.language', 'constant.character', 'constant.other', 'support.constant'], 'purple'],
  [['variable.language.this', 'variable.language.self', 'variable.language.super'], 'purple', 'italic'],
  [['variable', 'variable.other', 'meta.object-literal.key', 'variable.other.property'], 'foreground'],
  [['variable.other.constant', 'variable.other.enummember'], 'purple'],
  [['support.type.property-name', 'meta.property-name.css'], 'cyan'],
  [['entity.name.tag'], 'pink'],
  [['entity.other.attribute-name'], 'green', 'italic'],
  [['entity.other.attribute-name.class.css', 'entity.other.attribute-name.id.css'], 'green'],
  [['punctuation', 'meta.brace', 'punctuation.separator', 'punctuation.terminator'], 'foreground'],
  [['punctuation.definition.tag'], 'pink'],
  [['invalid', 'invalid.illegal'], 'red'],
  [['invalid.deprecated'], 'red', 'underline'],
  [['markup.heading', 'entity.name.section'], 'purple', 'bold'],
  [['markup.bold'], 'orange', 'bold'],
  [['markup.italic'], 'yellow', 'italic'],
  [['markup.strikethrough'], 'comment', 'strikethrough'],
  [['markup.inline.raw', 'markup.raw', 'markup.fenced_code'], 'green'],
  [['markup.quote'], 'yellow', 'italic'],
  [['markup.underline.link', 'string.other.link'], 'cyan', 'underline'],
  [['markup.list', 'punctuation.definition.list'], 'cyan'],
  [['markup.inserted', 'markup.inserted.diff', 'meta.diff.header.to-file'], 'green'],
  [['markup.deleted', 'markup.deleted.diff', 'meta.diff.header.from-file'], 'red'],
  [['markup.changed', 'meta.diff.range'], 'orange'],
  [['support.type.property-name.json'], 'cyan'],
  [['keyword.other.unit'], 'pink']
]

function appTokens() {
  const mutedText = readable('#9aa2c9', [c.background, c.deep, c.surface], 4.5)
  return {
    '--background': c.background,
    '--editor-surface': c.background,
    '--foreground': c.foreground,
    '--card': c.surface,
    '--card-foreground': c.foreground,
    '--popover': c.surface,
    '--popover-foreground': c.foreground,
    '--primary': c.pink,
    '--primary-foreground': c.deep,
    '--secondary': c.raised,
    '--secondary-foreground': c.foreground,
    '--muted': c.deep,
    '--muted-foreground': mutedText,
    '--accent': c.selection,
    '--accent-foreground': c.foreground,
    '--border': c.border,
    '--input': c.selection,
    '--ring': c.purple,
    '--chart-1': c.pink,
    '--chart-2': c.cyan,
    '--chart-3': c.green,
    '--chart-4': c.purple,
    '--chart-5': c.orange,
    '--sidebar': c.deep,
    '--sidebar-foreground': c.foreground,
    '--sidebar-primary': c.pink,
    '--sidebar-primary-foreground': c.deep,
    '--sidebar-accent': c.selection,
    '--sidebar-accent-foreground': c.foreground,
    '--sidebar-border': c.border,
    '--sidebar-ring': c.purple
  }
}

// Dracula's terminal colors.
function terminal() {
  return {
    schemaVersion: 1,
    mode: 'dark',
    terminal: {
      background: c.background,
      foreground: c.foreground,
      cursor: c.pink,
      cursorAccent: c.background,
      selectionBackground: c.selection,
      selectionForeground: c.foreground,
      black: '#21222c',
      red: c.red,
      green: c.green,
      yellow: c.yellow,
      blue: c.purple,
      magenta: c.pink,
      cyan: c.cyan,
      white: c.foreground,
      brightBlack: c.comment,
      brightRed: '#ff6e6e',
      brightGreen: '#69ff94',
      brightYellow: '#ffffa5',
      brightBlue: '#d6acff',
      brightMagenta: '#ff92df',
      brightCyan: '#a4ffff',
      brightWhite: '#ffffff'
    }
  }
}

// WCAG 2 relative luminance and contrast, as Orca checks theme colors.
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

// Orca drops a code color under 3:1 and a text color under 4.5:1; such a color is lightened,
// keeping its hue, until it passes.
function readable(hex, backgrounds, minimum) {
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const toHex = () => `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`
  for (let step = 0; step < 100; step++) {
    const candidate = toHex()
    if (backgrounds.every((background) => contrast(candidate, background) >= minimum)) return candidate
    ;[r, g, b] = [r, g, b].map((x) => Math.min(255, x * 1.02 + 1))
  }
  return toHex()
}

const TEXT_PAIRS = [
  ['--background', '--foreground'], ['--card', '--card-foreground'], ['--popover', '--popover-foreground'],
  ['--primary', '--primary-foreground'], ['--secondary', '--secondary-foreground'],
  ['--muted', '--muted-foreground'], ['--background', '--muted-foreground'], ['--accent', '--accent-foreground'],
  ['--sidebar', '--sidebar-foreground'], ['--sidebar-primary', '--sidebar-primary-foreground'],
  ['--sidebar-accent', '--sidebar-accent-foreground']
]

const problems = []
const adjusted = new Set()
const tokens = appTokens()
for (const [surface, text] of TEXT_PAIRS) {
  const ratio = contrast(tokens[surface], tokens[text])
  if (ratio < 4.5) problems.push(`${text} on ${surface} is ${ratio.toFixed(2)}:1, under 4.5:1`)
}
const tokenColors = TOKEN_ROLES.map(([scope, role, fontStyle]) => {
  const foreground = readable(c[role], [c.background], 3)
  if (foreground !== c[role]) adjusted.add(`${role} ${c[role]} -> ${foreground}`)
  return { scope, settings: fontStyle ? { foreground, fontStyle } : { foreground } }
})

mkdirSync(path.join(ROOT, 'themes'), { recursive: true })
mkdirSync(path.join(ROOT, 'terminal'), { recursive: true })
writeFileSync(path.join(ROOT, 'themes', `${ID}.json`), `${JSON.stringify({ base: 'dark', tokens, tokenColors }, null, 2)}\n`)
writeFileSync(path.join(ROOT, 'terminal', `${ID}.json`), `${JSON.stringify(terminal(), null, 2)}\n`)
if (adjusted.size) console.error(`Adjusted for contrast:\n${[...adjusted].join('\n')}`)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exitCode = 1
}
console.log(`${TITLE}: ${tokenColors.length} token rules, ${Object.keys(tokens).length} app tokens`)
