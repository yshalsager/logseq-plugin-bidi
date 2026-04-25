export type TextDirection = 'rtl' | 'ltr' | 'auto'
type StrongTextDirection = 'rtl' | 'ltr'

type PageRefSpan = {
  end_idx: number
  label: string | null
  start_idx: number
  target: string
}

const rtl_char_regex = /[\u0590-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/
const ltr_char_regex = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u052F]/

const checkbox_prefix_regex = /^\[(?: |x|X|-)\]\s*/
const ordered_list_prefix_regex = /^\d+[.)]\s+/
const task_marker_prefix_regex = /^(?:TODO|NOW|LATER|DOING|DONE|WAITING|CANCELED|CANCELLED)\b[:：]?\s*/i
const property_prefix_regex = /^[^:\n]{1,80}::\s*/
const page_ref_wrapper_regex = /^\[\[([\s\S]+)\]\]$/
const markdown_link_wrapper_regex = /^\[([\s\S]+)\]\(([\s\S]+)\)$/
const leading_neutral_prefix_regex = /^[\s\u2022>*-]+/
const maybe_inline_markup_regex = /[()\[\]]/

const max_dir_sample_length = 512
const max_first_strong_scan_length = 256
const max_text_dir_cache_size = 2000

const text_dir_cache = new Map<string, TextDirection>()

export const non_blank_string = (value: unknown): value is string => (
  typeof value === 'string' && value.trim().length > 0
)

const sample_dir_text = (text: string): string => (
  text.length > max_dir_sample_length
    ? text.slice(0, max_dir_sample_length)
    : text
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

const first_strong_char_dir = (text: string): StrongTextDirection | null => {
  const length = Math.min(text.length, max_first_strong_scan_length)
  for (let i = 0; i < length; i += 1) {
    const char = text[i]
    if (rtl_char_regex.test(char)) return 'rtl'
    if (ltr_char_regex.test(char)) return 'ltr'
  }
  return null
}

const infer_text_dir_helper = (text: string): TextDirection => {
  if (!text) return 'auto'

  let rtl_count = 0
  let ltr_count = 0
  for (const char of text) {
    if (rtl_char_regex.test(char)) rtl_count += 1
    else if (ltr_char_regex.test(char)) ltr_count += 1
  }

  if (rtl_count === 0 && ltr_count === 0) return 'auto'
  if (rtl_count === ltr_count) return 'auto'
  return rtl_count > ltr_count ? 'rtl' : 'ltr'
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

const infer_text_direction_uncached = (sampled: string): TextDirection => {
  const normalized = normalize_text_for_dir(sampled)
  const first_strong_dir = first_strong_char_dir(normalized)
  const inferred_dir = first_strong_dir ?? infer_text_dir_helper(normalized)
  const should_parse_inline = inferred_dir === 'auto' && maybe_inline_markup_regex.test(normalized)

  if (!should_parse_inline) return inferred_dir

  const visible_text = normalize_text_for_dir(extract_visible_inline_text(normalized))
  const fallback_first_strong = first_strong_char_dir(visible_text)
  return fallback_first_strong ?? infer_text_dir_helper(visible_text)
}

export const infer_text_direction = (text: string): TextDirection => {
  const sampled = sample_dir_text(text || '')
  const cached = text_dir_cache.get(sampled)
  if (cached) return cached

  const inferred = infer_text_direction_uncached(sampled)
  text_dir_cache.set(sampled, inferred)

  if (text_dir_cache.size > max_text_dir_cache_size) {
    const first_key = text_dir_cache.keys().next().value as string | undefined
    if (first_key) text_dir_cache.delete(first_key)
  }

  return inferred
}
