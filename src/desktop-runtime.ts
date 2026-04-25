import { css_attr_value } from './css-utils'
import { infer_text_direction, non_blank_string, type TextDirection } from './direction'
import { current_page_title, get_block_content_by_id } from './logseq-data'
import { create_debounced, type Cleanup } from './runtime-utils'

const block_selector = '.ls-block, .ls-page-title'
const block_main_container_selector = '.ls-block > .block-main-container'
const content_wrap_selector = ':scope > .block-main-container > .block-main-content-wrap, :scope > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap)'
const editor_selector = '.editor-inner textarea, #mock-text'
const observer_debounce_ms = 40

let host_block_dir_cache = new Map<string, TextDirection>()

const collect_dom_blocks = (graph_document: Document): Array<{ block_id: string; main_container_node: Element; text: string }> => {
  const blocks: Array<{ block_id: string; main_container_node: Element; text: string }> = []

  graph_document.querySelectorAll('.ls-block[blockid]').forEach((node) => {
    const block_id = node.getAttribute('blockid')
    if (!block_id) return

    const main_container_node = node.querySelector(':scope > .block-main-container')
    if (!main_container_node) return

    const content_wrap = node.querySelector(content_wrap_selector)
    const own_content_text = content_wrap?.querySelector('.block-content')?.textContent
    const own_content_inner_text = content_wrap?.querySelector('.block-content-inner')?.textContent
    const own_title_text = content_wrap?.querySelector('.block-title-wrap')?.textContent
    const own_editor_text = content_wrap?.querySelector<HTMLTextAreaElement>('.editor-inner textarea[id^="edit-block-"]')?.value
    const text = (
      own_editor_text ??
      own_content_text ??
      own_content_inner_text ??
      own_title_text ??
      ''
    ).trim()

    blocks.push({ block_id, main_container_node, text })
  })

  return blocks
}

const set_main_container_direction = (
  main_container_node: Element,
  direction: TextDirection
): void => {
  if (main_container_node.getAttribute('data-row-dir') === direction) return
  main_container_node.setAttribute('data-row-dir', direction)
}

const set_block_row_direction = (
  graph_document: Document,
  block_id: string,
  direction: TextDirection
): void => {
  const block_node = graph_document.querySelector(`.ls-block[blockid="${css_attr_value(block_id)}"]`)
  const main_container_node = block_node?.querySelector(':scope > .block-main-container')
  if (!main_container_node) return

  set_main_container_direction(main_container_node, direction)
}

const sync_host_page_direction = async (graph_document: Document): Promise<void> => {
  const editing_state = await logseq.Editor.checkEditing().catch(() => false)
  const editing_block_id = typeof editing_state === 'string' ? editing_state : null
  const editing_content = editing_block_id
    ? await logseq.Editor.getEditingBlockContent().catch(() => '')
    : null

  const dom_blocks = collect_dom_blocks(graph_document)
  const next_dir_cache = new Map<string, TextDirection>()
  dom_blocks.forEach(({ block_id, main_container_node, text }) => {
    const source_text = block_id === editing_block_id
      ? (non_blank_string(editing_content) ? editing_content : text)
      : text
    const cached_direction = host_block_dir_cache.get(block_id)
    const direction = non_blank_string(source_text)
      ? infer_text_direction(source_text)
      : cached_direction ?? 'auto'
    next_dir_cache.set(block_id, direction)
    set_main_container_direction(main_container_node, direction)
  })
  host_block_dir_cache = next_dir_cache

  const page_title = await current_page_title()
  const page_title_direction = infer_text_direction(page_title)
  const page_title_dir_attr = page_title_direction === 'auto' ? 'auto' : page_title_direction
  graph_document.querySelectorAll('.ls-page-title').forEach((node) => {
    node.setAttribute('dir', page_title_dir_attr)
  })
}

const set_dir_auto = (node: Element): void => {
  if (!node.hasAttribute('dir')) node.setAttribute('dir', 'auto')
}

const set_editor_dir_auto = (node: Element): void => {
  if (node.getAttribute('dir') !== 'auto') node.setAttribute('dir', 'auto')
}

const apply_editor_auto_dir_to_node = (node: Node): void => {
  if (!(node instanceof Element)) return

  if (node.matches(editor_selector)) set_editor_dir_auto(node)

  node.querySelectorAll(editor_selector).forEach((editor_node) => set_editor_dir_auto(editor_node))
}

const removed_editor_block_id = (mutation: MutationRecord): string | null => {
  if (mutation.removedNodes.length === 0) return null

  const removed_editor = Array.from(mutation.removedNodes).find((node) => {
    if (!(node instanceof Element)) return false
    return node.classList.contains('editor-inner') || node.classList.contains('block-editor')
  })
  if (!removed_editor) return null

  const target_element = mutation.target instanceof Element ? mutation.target : null
  return target_element?.closest('.ls-block[blockid]')?.getAttribute('blockid') ?? null
}

const apply_auto_dir = (graph_document: Document): void => {
  graph_document.querySelectorAll(block_selector).forEach((node) => set_dir_auto(node))
  graph_document.querySelectorAll(block_main_container_selector).forEach((node) => set_dir_auto(node))
  graph_document.querySelectorAll(editor_selector).forEach((node) => set_editor_dir_auto(node))
}

export const install_host_direction_runtime = (graph_document: Document): Cleanup => {
  const debounced_sync = create_debounced(() => {
    apply_auto_dir(graph_document)
    void sync_host_page_direction(graph_document)
  }, observer_debounce_ms)

  const observer = new MutationObserver((mutations) => {
    const removed_editor_block_ids = new Set<string>()

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => apply_editor_auto_dir_to_node(node))

      const block_id = removed_editor_block_id(mutation)
      if (!block_id) return

      removed_editor_block_ids.add(block_id)
    })

    removed_editor_block_ids.forEach((block_id) => {
      void get_block_content_by_id(block_id).then((content) => {
        const direction = infer_text_direction(content)
        host_block_dir_cache.set(block_id, direction)
        set_block_row_direction(graph_document, block_id, direction)
      })
    })

    debounced_sync.run()
  })

  const root_node = graph_document.documentElement ?? graph_document

  observer.observe(root_node, {
    childList: true,
    subtree: true
  })

  const off_route_changed = logseq.App.onRouteChanged(() => debounced_sync.run())
  const off_db_changed = logseq.DB.onChanged(() => debounced_sync.run())

  apply_auto_dir(graph_document)
  debounced_sync.run()
  window.setTimeout(() => debounced_sync.run(), 300)

  return () => {
    debounced_sync.cancel()
    observer.disconnect()
    off_route_changed()
    off_db_changed()
    host_block_dir_cache = new Map<string, TextDirection>()
  }
}

const try_get_window_document = (target_window: Window | null | undefined): Document | null => {
  if (!target_window) return null
  try {
    return target_window.document ?? null
  } catch (_error) {
    return null
  }
}

const doc_has_graph_blocks = (target_document: Document | null): boolean => (
  !!target_document?.querySelector('.ls-block[blockid] > .block-main-container, .ls-block > .block-main-container')
)

export const get_graph_document = (): {
  graph_block_dom_available: boolean
  graph_document: Document
  host_dom_access: boolean
} => {
  const top_document = try_get_window_document(window.top)
  const parent_document = try_get_window_document(window.parent)
  const self_document = document

  const candidates = [top_document, parent_document, self_document].filter((doc): doc is Document => !!doc)
  const unique_candidates = Array.from(new Set(candidates))
  const graph_document_with_blocks = unique_candidates.find((doc) => doc_has_graph_blocks(doc))
  const graph_candidate = graph_document_with_blocks ?? unique_candidates[0] ?? self_document

  return {
    graph_block_dom_available: !!graph_document_with_blocks,
    graph_document: graph_candidate,
    host_dom_access: graph_candidate !== self_document
  }
}
