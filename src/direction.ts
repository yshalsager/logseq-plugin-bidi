export type TextDirection = 'rtl' | 'ltr' | 'auto'
export type DirectionResolver = (text: string) => TextDirection

type PageRefSpan = {
  end_idx: number
  label: string | null
  start_idx: number
  target: string
}

const checkbox_prefix_regex = /^\[(?: |x|X|-)\]\s*/
const ordered_list_prefix_regex = /^\d+[.)]\s+/
const task_marker_prefix_regex = /^(?:TODO|NOW|LATER|DOING|DONE|WAITING|CANCELED|CANCELLED)\b[:：]?\s*/i
const property_prefix_regex = /^[^:\n]{1,80}::\s*/
const page_ref_wrapper_regex = /^\[\[([\s\S]+)\]\]$/
const markdown_link_wrapper_regex = /^\[([\s\S]+)\]\(([\s\S]+)\)$/
const leading_neutral_prefix_regex = /^[\s\u2022>*-]+/
const maybe_inline_markup_regex = /[()\[\]]/

const max_text_dir_cache_size = 2000

export const non_blank_string = (value: unknown): value is string => (
  typeof value === 'string' && value.trim().length > 0
)

const unwrap_dir_text_once = (text: string): string => {
  const page_ref_match = text.match(page_ref_wrapper_regex)
  if (page_ref_match) {
    const inner = page_ref_match[1]
    const label_start = inner.lastIndexOf('][')
    return label_start >= 0 ? inner.slice(label_start + 2) : inner
  }

  const markdown_link_match = text.match(markdown_link_wrapper_regex)
  if (markdown_link_match) return markdown_link_match[1]

  return text
}

const strip_dir_prefixes_once = (text: string): string => (
  text
    .trimStart()
    .replace(leading_neutral_prefix_regex, '')
    .replace(checkbox_prefix_regex, '')
    .replace(ordered_list_prefix_regex, '')
    .replace(task_marker_prefix_regex, '')
    .replace(property_prefix_regex, '')
)

const normalize_text_for_dir = (text: string): string => {
  const stripped = strip_dir_prefixes_once(text)
  const unwrapped = unwrap_dir_text_once(stripped).trim()
  if (stripped === unwrapped) return unwrapped
  return strip_dir_prefixes_once(unwrapped).trim()
}

const parse_balanced = (
  text: string,
  start_idx: number,
  open: string,
  close: string
): { content: string; end_idx: number } | null => {
  if (!text.startsWith(open, start_idx)) return null
  let depth = 1
  let idx = start_idx + open.length
  const content_start = idx

  while (idx < text.length) {
    if (text.startsWith(open, idx)) {
      depth += 1
      idx += open.length
      continue
    }
    if (text.startsWith(close, idx)) {
      depth -= 1
      if (depth === 0) {
        return { content: text.slice(content_start, idx), end_idx: idx + close.length }
      }
      idx += close.length
      continue
    }
    idx += 1
  }

  return null
}

const page_ref_parts = (content: string): { target: string; label: string | null } => {
  const label_start = content.lastIndexOf('][')
  if (label_start < 0) return { target: content, label: null }
  return {
    target: content.slice(0, label_start),
    label: content.slice(label_start + 2)
  }
}

const parse_page_ref_at = (text: string, start_idx: number): PageRefSpan | null => {
  const page_ref = parse_balanced(text, start_idx, '[[', ']]')
  if (!page_ref) return null

  const { target, label } = page_ref_parts(page_ref.content)
  return {
    end_idx: page_ref.end_idx,
    label,
    start_idx,
    target
  }
}

export const extract_page_ref_spans = (text: string): Array<PageRefSpan> => {
  const refs: Array<PageRefSpan> = []
  let idx = 0

  while (idx < text.length) {
    if (!text.startsWith('[[', idx)) {
      idx += 1
      continue
    }

    const page_ref = parse_page_ref_at(text, idx)
    if (!page_ref) {
      idx += 1
      continue
    }

    refs.push(page_ref)
    idx = page_ref.end_idx
  }

  return refs
}

const extract_visible_inline_text = (text: string): string => {
  const parts: string[] = []
  let idx = 0

  while (idx < text.length) {
    if (text.startsWith('[[', idx)) {
      const page_ref = parse_page_ref_at(text, idx)
      if (page_ref) {
        const visible_content = page_ref.label ?? page_ref.target
        if (non_blank_string(visible_content)) parts.push(visible_content)
        idx = page_ref.end_idx
        continue
      }
    }

    if (text[idx] === '[' && !text.startsWith('[[', idx)) {
      const label = parse_balanced(text, idx, '[', ']')
      if (label && text[label.end_idx] === '(') {
        const target = parse_balanced(text, label.end_idx, '(', ')')
        if (target) {
          if (non_blank_string(label.content)) parts.push(label.content)
          idx = target.end_idx
          continue
        }
      }
    }

    parts.push(text[idx])
    idx += 1
  }

  return parts.join('').trim()
}

export const create_text_direction_probe = (target_document: Document): {
  cleanup: () => void
  infer_direction: DirectionResolver
} => {
  const container = target_document.createElement('div')
  container.style.cssText = 'position:fixed;left:-10000px;top:-10000px;visibility:hidden;pointer-events:none;'

  const create_probe = (parent_direction: 'ltr' | 'rtl'): HTMLElement => {
    const parent = target_document.createElement('div')
    const probe = target_document.createElement('span')
    parent.dir = parent_direction
    probe.dir = 'auto'
    parent.append(probe)
    container.append(parent)
    return probe
  }

  const ltr_probe = create_probe('ltr')
  const rtl_probe = create_probe('rtl')
  const cache = new Map<string, TextDirection>()
  ;(target_document.body ?? target_document.documentElement).append(container)

  const infer_direction = (text: string): TextDirection => {
    const normalized = normalize_text_for_dir(text || '')
    const visible_text = maybe_inline_markup_regex.test(normalized)
      ? normalize_text_for_dir(extract_visible_inline_text(normalized))
      : normalized
    if (!visible_text) return 'auto'

    const cached = cache.get(visible_text)
    if (cached) return cached

    ltr_probe.textContent = visible_text
    rtl_probe.textContent = visible_text
    const view = target_document.defaultView
    const ltr_direction = view?.getComputedStyle(ltr_probe).direction
    const rtl_direction = view?.getComputedStyle(rtl_probe).direction
    const direction = ltr_direction === rtl_direction && (ltr_direction === 'ltr' || ltr_direction === 'rtl')
      ? ltr_direction
      : 'auto'

    cache.set(visible_text, direction)
    if (cache.size > max_text_dir_cache_size) cache.delete(cache.keys().next().value as string)
    return direction
  }

  return {
    cleanup: () => container.remove(),
    infer_direction
  }
}
