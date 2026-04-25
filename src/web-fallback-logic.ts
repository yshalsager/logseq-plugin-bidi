import {
  extract_page_ref_spans,
  infer_text_direction,
  type TextDirection
} from './direction'
import {
  block_id_from_node,
  flatten_block_tree,
  row_dir_source_text
} from './logseq-data'

export type PageRefResolver = (target: string) => Promise<string | null>

export const create_cached_page_ref_resolver = (resolve_page_ref: PageRefResolver): PageRefResolver => {
  const cache = new Map<string, Promise<string | null>>()

  return (target: string): Promise<string | null> => {
    const cached = cache.get(target)
    if (cached) return cached

    const resolved = resolve_page_ref(target).catch(() => null)
    cache.set(target, resolved)
    return resolved
  }
}

export const resolve_page_refs_in_text = async (
  text: string,
  resolve_page_ref: PageRefResolver,
  refs = extract_page_ref_spans(text)
): Promise<string> => {
  if (!refs.length) return text

  const labels = await Promise.all(refs.map(async (ref) => ref.label ?? await resolve_page_ref(ref.target) ?? ref.target))
  const parts: string[] = []
  let offset = 0

  refs.forEach((ref, index) => {
    parts.push(text.slice(offset, ref.start_idx), labels[index])
    offset = ref.end_idx
  })
  parts.push(text.slice(offset))

  return parts.join('')
}

const infer_web_fallback_block_direction = async (
  source_text: string,
  resolve_page_ref: PageRefResolver
): Promise<TextDirection> => {
  const direction = infer_text_direction(source_text)
  if (direction === 'rtl' || !source_text.includes('[[')) return direction

  const page_refs = extract_page_ref_spans(source_text)
  if (!page_refs.length) return direction

  const text_before_first_ref = source_text.slice(0, page_refs[0].start_idx)
  const prefix_direction = infer_text_direction(text_before_first_ref)
  if (prefix_direction !== 'auto') return direction

  const resolved_text = await resolve_page_refs_in_text(source_text, resolve_page_ref, page_refs)
  if (resolved_text === source_text) return direction

  const resolved_direction = infer_text_direction(resolved_text)
  return resolved_direction === 'auto' ? direction : resolved_direction
}

export const collect_rtl_block_ids_from_tree = async (
  blocks: Array<unknown>,
  resolve_page_ref: PageRefResolver
): Promise<Array<string>> => {
  const block_ids = await Promise.all(flatten_block_tree(blocks).map(async (block) => {
    const block_id = block_id_from_node(block)
    if (!block_id) return null

    const source_text = row_dir_source_text(block)
    const direction = await infer_web_fallback_block_direction(source_text, resolve_page_ref)
    return direction === 'rtl' ? block_id : null
  }))
  return block_ids.filter((block_id): block_id is string => typeof block_id === 'string')
}
