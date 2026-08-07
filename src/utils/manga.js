export function truncate(text, length = 140) {
  if (!text || text.length <= length) return text || ''
  return `${text.slice(0, length).trimEnd()}…`
}

export function formatDate(value) {
  if (!value) return 'Unknown date'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

export function seededShuffle(items, seedText) {
  let seed = [...String(seedText)].reduce((value, character) => value + character.charCodeAt(0), 0) || 1
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 9301 + 49297) % 233280
    const target = Math.floor((seed / 233280) * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled
}

export function chapterLabel(chapter) {
  const number = chapter.chapter ? `Chapter ${chapter.chapter}` : 'Oneshot'
  return chapter.title ? `${number}: ${chapter.title}` : number
}

