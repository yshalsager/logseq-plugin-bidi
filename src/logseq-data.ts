import type { BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin'
import { type TextDirection } from './direction'
import { log_debug, type BidiSettings } from './settings'

export type BlockNode = Partial<BlockEntity> & Record<string, unknown>
type PageNode = (Partial<PageEntity> | Partial<BlockEntity>) & Record<string, unknown>

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

export const read_direction_overrides = async (): Promise<Map<string, TextDirection>> => {
  const rows = await logseq.DB.datascriptQuery<Array<[string, TextDirection]>>(`
    [:find ?uuid ?direction
     :where
     [?b :block/uuid ?uuid]
     [?b :plugin.property.logseq-plugin-bidi/direction ?value]
     [?value :block/title ?direction]]
  `).catch(() => [])
  return new Map(rows.filter(([, direction]) => direction === 'rtl' || direction === 'ltr'))
}

export const row_dir_source_text = (block: BlockNode): string => (
  first_non_blank_string([
    get_record_string(block, 'fullTitle'),
    get_record_string(block, 'full-title'),
    get_record_string(block, 'title'),
    get_record_string(block, 'content'),
    get_record_string(block, 'originalName'),
    get_record_string(block, 'original-name'),
    get_record_string(block, 'name'),
    get_record_string(block, 'rawTitle'),
    get_record_string(block, 'raw-title')
  ]) ?? ''
)

const is_block_uuid_tuple = (value: unknown): value is ['uuid', string] => (
  Array.isArray(value) && value.length === 2 && value[0] === 'uuid' && typeof value[1] === 'string'
)

export const resolve_block_tree_tuples = async (
  blocks: Array<unknown>,
  resolve_block: (uuid: string) => Promise<BlockNode | null>
): Promise<Array<unknown>> => Promise.all(blocks.map(async (block) => {
  if (is_block_uuid_tuple(block)) {
    const resolved = await resolve_block(block[1])
    return resolved ? (await resolve_block_tree_tuples([resolved], resolve_block))[0] : null
  }
  if (!is_record(block) || !Array.isArray(block.children)) return block
  return { ...block, children: await resolve_block_tree_tuples(block.children, resolve_block) }
})).then((resolved) => resolved.filter((block) => block !== null))

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

export const page_title_from_record = (page: PageNode | null): string | null => (
  page
    ? get_record_string(page, 'originalName') ??
      get_record_string(page, 'title') ??
      get_record_string(page, 'name')
    : null
)

const page_identity_from_record = (page: PageNode | null): string | null => (
  page ? get_record_string(page, 'uuid') ?? page_title_from_record(page) : null
)

export const read_current_page_blocks_tree = async (settings: BidiSettings): Promise<Array<unknown>> => {
  const resolve_tuples = (blocks: Array<unknown>): Promise<Array<unknown>> => resolve_block_tree_tuples(
    blocks,
    (uuid) => logseq.Editor.getBlock(uuid, { includeChildren: true }).catch((error) => {
      log_debug(settings, `getBlock tuple fallback failed: ${String(error)}`)
      return null
    })
  )
  const current_page_blocks = await logseq.Editor.getCurrentPageBlocksTree().catch((error) => {
    log_debug(settings, `getCurrentPageBlocksTree failed: ${String(error)}`)
    return null
  })
  if (Array.isArray(current_page_blocks) && current_page_blocks.length > 0) return resolve_tuples(current_page_blocks)

  const current_page = await logseq.Editor.getCurrentPage().catch((error) => {
    log_debug(settings, `getCurrentPage failed: ${String(error)}`)
    return null as PageNode | null
  })
  const page_identity = page_identity_from_record(current_page)
  if (!page_identity) return Array.isArray(current_page_blocks) ? current_page_blocks : []

  const page_blocks = await logseq.Editor.getPageBlocksTree(page_identity).catch((error) => {
    log_debug(settings, `getPageBlocksTree fallback failed: ${String(error)}`)
    return null
  })
  return Array.isArray(page_blocks) ? resolve_tuples(page_blocks) : []
}

export const current_page_title = async (): Promise<string> => {
  const current_page = await logseq.Editor.getCurrentPage().catch(() => null as PageNode | null)
  return page_title_from_record(current_page) ?? ''
}

export const get_block_content_by_id = async (block_id: string): Promise<string> => {
  const block = await logseq.Editor.getBlock(block_id).catch(() => null as BlockNode | null)
  if (!block || !is_record(block)) return ''
  return row_dir_source_text(block)
}
