import { create_text_direction_probe, non_blank_string, resolve_text_direction, type DirectionResolver, type TextDirection } from './direction'
import {
  block_id_from_node,
  current_page_title,
  flatten_block_tree,
  get_block_content_by_id,
  page_title_from_record,
  read_current_page_blocks_tree,
  read_direction_overrides
} from './logseq-data'
import { create_debounced, create_serialized_runner, type Cleanup } from './runtime-utils'
import { log_debug, type BidiSettings } from './settings'
import {
  collect_rtl_block_ids_from_tree,
  create_cached_page_ref_resolver,
  update_rtl_block_ids,
  type PageRefResolver
} from './web-fallback-logic'
import { build_editor_override_css, build_override_badges_css, build_page_title_css, build_rtl_blocks_css } from './web-fallback-css'

const fallback_page_style_key = 'logseq-plugin-bidi-fallback-page-style'
const fallback_editor_style_key = 'logseq-plugin-bidi-fallback-editor-style'

const fallback_sync_debounce_ms = 120
const fallback_page_poll_ms = 30000
const fallback_poll_skip_after_refresh_ms = 10000

let fallback_editor_style_cache = ''
let fallback_page_style_cache = ''
let fallback_page_title_style = ''
let fallback_rtl_block_ids = new Set<string>()
let fallback_direction_overrides = new Map<string, TextDirection>()
let last_fallback_page_refresh_ms = 0

const uuid_regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const resolve_logseq_page_ref = async (target: string): Promise<string | null> => {
  const page = await logseq.Editor.getPage(target).catch(() => null as Record<string, unknown> | null)
  const page_title = page_title_from_record(page)
  if (page_title || !uuid_regex.test(target)) return page_title

  const uuid_page = await logseq.Editor.getPage({ uuid: target } as { uuid: string }).catch(() => null as Record<string, unknown> | null)
  return page_title_from_record(uuid_page)
}

let resolve_page_ref = create_cached_page_ref_resolver(resolve_logseq_page_ref)

const reset_page_ref_cache = (): void => {
  resolve_page_ref = create_cached_page_ref_resolver(resolve_logseq_page_ref)
}

const set_fallback_page_style = (style: string): void => {
  if (style === fallback_page_style_cache) return
  fallback_page_style_cache = style
  logseq.provideStyle({ key: fallback_page_style_key, style })
}

const set_fallback_editor_style = (style: string): void => {
  if (style === fallback_editor_style_cache) return
  fallback_editor_style_cache = style
  logseq.provideStyle({ key: fallback_editor_style_key, style })
}

const current_fallback_page_style = (): string => (
  [fallback_page_title_style, build_rtl_blocks_css([...fallback_rtl_block_ids]), build_override_badges_css(fallback_direction_overrides)].join('\n')
)

const refresh_fallback_page_style = async (
  settings: BidiSettings,
  infer_direction: DirectionResolver,
  is_current: () => boolean
): Promise<void> => {
  last_fallback_page_refresh_ms = Date.now()
  const blocks = await read_current_page_blocks_tree(settings)
  if (!blocks || !is_current()) return

  const all_direction_overrides = await read_direction_overrides()
  if (!all_direction_overrides || !is_current()) return
  const current_block_ids = new Set(flatten_block_tree(blocks).map(block_id_from_node))
  const direction_overrides = new Map([...all_direction_overrides].filter(([block_id]) => current_block_ids.has(block_id)))
  const rtl_block_ids = await collect_rtl_block_ids_from_tree(blocks, resolve_page_ref, infer_direction, direction_overrides)
  if (!is_current()) return

  const page_title = await current_page_title()
  if (!is_current()) return

  fallback_rtl_block_ids = new Set(rtl_block_ids)
  fallback_direction_overrides = direction_overrides
  if (page_title !== null) fallback_page_title_style = build_page_title_css(infer_direction(page_title))
  log_debug(settings, `fallback page scan: rtl=${rtl_block_ids.length}`)
  set_fallback_page_style(current_fallback_page_style())
}

const refresh_changed_blocks = async (
  blocks: Array<unknown>,
  settings: BidiSettings,
  infer_direction: DirectionResolver,
  is_current: () => boolean
): Promise<void> => {
  const next_rtl_block_ids = new Set(fallback_rtl_block_ids)
  await update_rtl_block_ids(next_rtl_block_ids, blocks, resolve_page_ref, infer_direction)
  if (!is_current()) return

  fallback_rtl_block_ids = next_rtl_block_ids
  log_debug(settings, `fallback incremental update: changed=${blocks.length}, rtl=${fallback_rtl_block_ids.size}`)
  set_fallback_page_style(current_fallback_page_style())
}

const refresh_fallback_editor_style = async (
  settings: BidiSettings,
  infer_direction: DirectionResolver,
  is_current: () => boolean
): Promise<void> => {
  const editing_state = await logseq.Editor.checkEditing().catch(() => false)
  if (!is_current()) return

  if (typeof editing_state !== 'string') {
    set_fallback_editor_style('')
    return
  }

  const content = await logseq.Editor.getEditingBlockContent().catch(() => '')
  if (!is_current()) return

  const source_text = non_blank_string(content)
    ? content
    : await get_block_content_by_id(editing_state)
  if (!is_current()) return

  const direction = resolve_text_direction(source_text, infer_direction)
  const style = direction === 'rtl' || direction === 'ltr'
    ? build_editor_override_css(editing_state, direction)
    : ''

  set_fallback_editor_style(style)
}

export const install_fallback_direction_runtime = (settings: BidiSettings): Cleanup => {
  let route_epoch = 0
  const changed_blocks = new Map<string, Record<string, unknown>>()
  const direction_probe = create_text_direction_probe(document)
  const page_runner = create_serialized_runner((error) => {
    console.error('[logseq-plugin-bidi] fallback refresh failed', error)
  })
  const enqueue_page_refresh = (): void => {
    const epoch = route_epoch
    page_runner.run(() => refresh_fallback_page_style(
      settings,
      direction_probe.infer_direction,
      () => page_runner.is_active() && epoch === route_epoch
    ))
  }
  const enqueue_blocks_refresh = (blocks: Array<unknown>): void => {
    const epoch = route_epoch
    page_runner.run(() => refresh_changed_blocks(
      blocks,
      settings,
      direction_probe.infer_direction,
      () => page_runner.is_active() && epoch === route_epoch
    ))
  }
  const debounced_page_refresh = create_debounced(enqueue_page_refresh, fallback_sync_debounce_ms)
  const debounced_blocks_refresh = create_debounced(() => {
    const blocks = [...changed_blocks.values()]
    changed_blocks.clear()
    enqueue_blocks_refresh(blocks)
  }, fallback_sync_debounce_ms)
  const enqueue_editor_refresh = (): void => {
    const epoch = route_epoch
    page_runner.run(() => refresh_fallback_editor_style(
      settings,
      direction_probe.infer_direction,
      () => page_runner.is_active() && epoch === route_epoch
    ))
  }

  const off_route_changed = logseq.App.onRouteChanged(() => {
    route_epoch += 1
    changed_blocks.clear()
    debounced_blocks_refresh.cancel()
    debounced_page_refresh.run()
    enqueue_editor_refresh()
  })
  const off_db_changed = logseq.DB.onChanged((event) => {
    reset_page_ref_cache()
    event.blocks.forEach((block) => changed_blocks.set(String(block.uuid), block))
    debounced_blocks_refresh.run()
    enqueue_editor_refresh()
  })
  const page_poll_timer = window.setInterval(() => {
    if (Date.now() - last_fallback_page_refresh_ms < fallback_poll_skip_after_refresh_ms) return
    enqueue_page_refresh()
  }, fallback_page_poll_ms)

  debounced_page_refresh.run()
  const startup_timer = window.setTimeout(() => debounced_page_refresh.run(), 300)
  enqueue_editor_refresh()

  return () => {
    page_runner.cancel()
    direction_probe.cleanup()
    debounced_page_refresh.cancel()
    debounced_blocks_refresh.cancel()
    changed_blocks.clear()
    off_route_changed()
    off_db_changed()
    window.clearInterval(page_poll_timer)
    window.clearTimeout(startup_timer)
  }
}

export const clear_fallback_styles = (): void => {
  fallback_page_style_cache = ''
  fallback_editor_style_cache = ''
  fallback_page_title_style = ''
  fallback_rtl_block_ids = new Set<string>()
  fallback_direction_overrides = new Map<string, TextDirection>()
  last_fallback_page_refresh_ms = 0
  reset_page_ref_cache()
  logseq.provideStyle({ key: fallback_page_style_key, style: '' })
  logseq.provideStyle({ key: fallback_editor_style_key, style: '' })
}
