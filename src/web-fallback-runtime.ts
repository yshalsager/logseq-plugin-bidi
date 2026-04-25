import { infer_text_direction, non_blank_string } from './direction'
import {
  current_page_title,
  get_block_content_by_id,
  page_title_from_record,
  read_current_page_blocks_tree
} from './logseq-data'
import { create_debounced, type Cleanup } from './runtime-utils'
import { log_debug, type BidiSettings } from './settings'
import {
  collect_rtl_block_ids_from_tree,
  create_cached_page_ref_resolver,
  type PageRefResolver
} from './web-fallback-logic'
import { build_editor_override_css, build_page_title_css, build_rtl_blocks_css } from './web-fallback-css'

const fallback_page_style_key = 'logseq-plugin-bidi-fallback-page-style'
const fallback_editor_style_key = 'logseq-plugin-bidi-fallback-editor-style'

const fallback_sync_debounce_ms = 120
const fallback_editor_poll_ms = 400
const fallback_page_poll_ms = 30000
const fallback_poll_skip_after_refresh_ms = 10000

let fallback_editor_style_cache = ''
let fallback_page_style_cache = ''
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

const build_fallback_page_style = async (settings: BidiSettings): Promise<string> => {
  const rtl_block_ids = await collect_rtl_block_ids_from_tree(
    await read_current_page_blocks_tree(settings),
    resolve_page_ref
  )
  log_debug(settings, `fallback page scan: rtl=${rtl_block_ids.length}`)

  const page_title = await current_page_title()
  const page_title_direction = infer_text_direction(page_title)

  return [build_page_title_css(page_title_direction), build_rtl_blocks_css(rtl_block_ids)].join('\n')
}

const refresh_fallback_page_style = async (settings: BidiSettings): Promise<void> => {
  last_fallback_page_refresh_ms = Date.now()
  const style = await build_fallback_page_style(settings).catch((error) => {
    console.error('[logseq-plugin-bidi] fallback page style failed', error)
    return ''
  })
  set_fallback_page_style(style)
}

const refresh_fallback_editor_style = async (settings: BidiSettings): Promise<void> => {
  const editing_state = await logseq.Editor.checkEditing().catch(() => false)
  if (typeof editing_state !== 'string') {
    set_fallback_editor_style('')
    return
  }

  const content = await logseq.Editor.getEditingBlockContent().catch(() => '')
  const source_text = non_blank_string(content)
    ? content
    : await get_block_content_by_id(editing_state)
  const direction = infer_text_direction(source_text)
  const style = direction === 'rtl' || direction === 'ltr'
    ? build_editor_override_css(editing_state, direction)
    : ''

  set_fallback_editor_style(style)
}

export const install_fallback_direction_runtime = (settings: BidiSettings): Cleanup => {
  const debounced_page_refresh = create_debounced(() => {
    void refresh_fallback_page_style(settings)
  }, fallback_sync_debounce_ms)

  const off_route_changed = logseq.App.onRouteChanged(() => debounced_page_refresh.run())
  const off_db_changed = logseq.DB.onChanged(() => {
    reset_page_ref_cache()
    debounced_page_refresh.run()
  })
  const page_poll_timer = window.setInterval(() => {
    if (Date.now() - last_fallback_page_refresh_ms < fallback_poll_skip_after_refresh_ms) return
    void refresh_fallback_page_style(settings)
  }, fallback_page_poll_ms)
  const editor_poll_timer = window.setInterval(() => {
    void refresh_fallback_editor_style(settings)
  }, fallback_editor_poll_ms)

  debounced_page_refresh.run()
  window.setTimeout(() => debounced_page_refresh.run(), 300)
  void refresh_fallback_editor_style(settings)

  return () => {
    debounced_page_refresh.cancel()
    off_route_changed()
    off_db_changed()
    window.clearInterval(page_poll_timer)
    window.clearInterval(editor_poll_timer)
  }
}

export const clear_fallback_styles = (): void => {
  fallback_page_style_cache = ''
  fallback_editor_style_cache = ''
  last_fallback_page_refresh_ms = 0
  reset_page_ref_cache()
  logseq.provideStyle({ key: fallback_page_style_key, style: '' })
  logseq.provideStyle({ key: fallback_editor_style_key, style: '' })
}
