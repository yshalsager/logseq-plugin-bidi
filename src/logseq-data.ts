import { log_debug, type BidiSettings } from './settings'

export type BlockNode = Record<string, unknown>

const is_record = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const get_record_string = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key]
  return typeof value === 'string' ? value : null
}

const first_non_blank_string = (values: Array<string | null>): string | null => {
  for (const value of values) {
    if (value && value.trim().length > 0) return value
  }
  return null
}

export const row_dir_source_text = (block: Record<string, unknown>): string => (
  first_non_blank_string([
    get_record_string(block, 'content'),
    get_record_string(block, 'title'),
    get_record_string(block, 'fullTitle'),
    get_record_string(block, 'full-title'),
    get_record_string(block, 'originalName'),
    get_record_string(block, 'original-name'),
    get_record_string(block, 'name'),
    get_record_string(block, 'rawTitle'),
    get_record_string(block, 'raw-title')
  ]) ?? ''
)

const append_flattened_block_tree = (blocks: Array<unknown>, output: Array<BlockNode>): void => {
  blocks.forEach((block) => {
    if (!is_record(block)) return

    output.push(block)

    const children = block.children
    if (Array.isArray(children) && children.length > 0) {
      append_flattened_block_tree(children, output)
    }
  })
}

export const flatten_block_tree = (blocks: Array<unknown>): Array<BlockNode> => {
  const output: Array<BlockNode> = []
  append_flattened_block_tree(blocks, output)
  return output
}

export const block_id_from_node = (block: BlockNode): string | null => (
  get_record_string(block, 'uuid') ?? get_record_string(block, 'block/uuid')
)

export const page_title_from_record = (page: Record<string, unknown> | null): string | null => (
  page
    ? get_record_string(page, 'originalName') ??
      get_record_string(page, 'name') ??
      get_record_string(page, 'title')
    : null
)

const page_identity_from_record = (page: Record<string, unknown> | null): string | null => (
  page ? get_record_string(page, 'uuid') ?? page_title_from_record(page) : null
)

export const read_current_page_blocks_tree = async (settings: BidiSettings): Promise<Array<unknown>> => {
  const current_page_blocks = await logseq.Editor.getCurrentPageBlocksTree().catch((error) => {
    log_debug(settings, `getCurrentPageBlocksTree failed: ${String(error)}`)
    return null
  })
  if (Array.isArray(current_page_blocks) && current_page_blocks.length > 0) return current_page_blocks

  const current_page = await logseq.Editor.getCurrentPage().catch((error) => {
    log_debug(settings, `getCurrentPage failed: ${String(error)}`)
    return null as Record<string, unknown> | null
  })
  const page_identity = page_identity_from_record(current_page)
  if (!page_identity) return Array.isArray(current_page_blocks) ? current_page_blocks : []

  const page_blocks = await logseq.Editor.getPageBlocksTree(page_identity).catch((error) => {
    log_debug(settings, `getPageBlocksTree fallback failed: ${String(error)}`)
    return null
  })
  return Array.isArray(page_blocks) ? page_blocks : []
}

export const current_page_title = async (): Promise<string> => {
  const current_page = await logseq.Editor.getCurrentPage().catch(() => null as Record<string, unknown> | null)
  return page_title_from_record(current_page) ?? ''
}

export const get_block_content_by_id = async (block_id: string): Promise<string> => {
  const block = await logseq.Editor.getBlock(block_id).catch(() => null as Record<string, unknown> | null)
  if (!block || !is_record(block)) return ''
  return row_dir_source_text(block)
}
