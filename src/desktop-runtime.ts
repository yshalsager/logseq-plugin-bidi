import { type Cleanup } from './runtime-utils'

const auto_dir_selector = `
.ls-block:not(.is-comments-area):not(:has(> .block-main-container > .block-renderer-container)) .block-content,
.ls-block:not(.is-comments-area):not(:has(> .block-main-container > .block-renderer-container)) .block-content-inner,
.ls-block:not(.is-comments-area):not(:has(> .block-main-container > .block-renderer-container)) .block-title-wrap,
.ls-comment-body .block-content[blockid],
.ls-page-title,
.editor-inner textarea,
#mock-text`

const excluded_block_selector = '.ls-block:is(.is-comments-area, :has(> .block-main-container > .block-renderer-container))'

const set_dir_auto = (node: Element): void => {
  if (node.getAttribute('dir') !== 'auto') node.setAttribute('dir', 'auto')
}

const clear_excluded_block_direction = (node: Element): void => {
  node.removeAttribute('dir')
  const main_container = node.querySelector(':scope > .block-main-container')
  main_container?.removeAttribute('dir')
  main_container?.removeAttribute('data-row-dir')
}

const apply_auto_dir_to_node = (node: Node): void => {
  if (node.nodeType !== 1) return
  const element = node as Element

  if (element.matches(auto_dir_selector)) set_dir_auto(element)
  element.querySelectorAll(auto_dir_selector).forEach(set_dir_auto)

  if (element.matches(excluded_block_selector)) clear_excluded_block_direction(element)
  element.querySelectorAll(excluded_block_selector).forEach(clear_excluded_block_direction)
}

export const install_host_direction_runtime = (graph_document: Document): Cleanup => {
  apply_auto_dir_to_node(graph_document.documentElement)

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach(apply_auto_dir_to_node))
  })
  observer.observe(graph_document.documentElement ?? graph_document, {
    childList: true,
    subtree: true
  })

  return () => observer.disconnect()
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
