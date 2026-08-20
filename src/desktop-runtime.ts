import { text_direction_override, type TextDirection } from './direction'
import { read_direction_overrides } from './logseq-data'
import { type Cleanup } from './runtime-utils'
import { build_override_badges_css } from './web-fallback-css'

const outline_block_selector = '.ls-block:not(.is-comments-area):not([data-comment-item]):not([data-is-property]):not([data-query]):not([data-transclude]):not([data-embed]):not(:has(> .block-main-container.is-page-title-row)):not(:has(> .block-main-container[data-row-dir])):not(:has(> .block-main-container > .block-renderer-container))'
const auto_dir_selector = `
${outline_block_selector} .block-content,
${outline_block_selector} .block-content-inner,
${outline_block_selector} .block-title-wrap,
.ls-comment-body .block-content[blockid],
.ls-page-title,
.editor-inner textarea,
#mock-text`

const override_block_selector = `${outline_block_selector}[data-block-title]`

const set_dir_auto = (node: Element): void => {
  if (node.getAttribute('dir') !== 'auto') node.setAttribute('dir', 'auto')
}

const apply_block_override = (block: Element, direction?: TextDirection | null): void => {
  const override = direction ?? text_direction_override(block.getAttribute('data-block-title') ?? '')
  if (!override) return

  block.querySelectorAll(auto_dir_selector).forEach((node) => {
    if (node.closest('.ls-block') === block) node.setAttribute('dir', override)
  })
}

const apply_auto_dir_to_node = (node: Node): void => {
  if (node.nodeType !== 1) return
  const element = node as Element

  if (element.matches(auto_dir_selector)) set_dir_auto(element)
  element.querySelectorAll(auto_dir_selector).forEach(set_dir_auto)

  const parent_block = element.closest(override_block_selector)
  if (parent_block) apply_block_override(parent_block)
  element.querySelectorAll(override_block_selector).forEach((block) => apply_block_override(block))
}

export const install_host_direction_runtime = (graph_document: Document): Cleanup => {
  let refresh_epoch = 0
  const refresh_entity_overrides = async (): Promise<void> => {
    const epoch = ++refresh_epoch
    const overrides = await read_direction_overrides()
    if (epoch !== refresh_epoch) return
    logseq.provideStyle({ key: 'logseq-plugin-bidi-override-badges', style: build_override_badges_css(overrides) })
    overrides.forEach((direction, block_id) => {
      const element = graph_document.querySelector(`.ls-block[blockid="${block_id}"]`)
      if (element) apply_block_override(element, direction)
    })
  }

  apply_auto_dir_to_node(graph_document.documentElement)

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') apply_auto_dir_to_node(mutation.target)
      else mutation.addedNodes.forEach(apply_auto_dir_to_node)
    })
  })
  observer.observe(graph_document.documentElement ?? graph_document, {
    attributeFilter: ['data-block-title'],
    attributes: true,
    childList: true,
    subtree: true
  })

  const off_route_changed = logseq.App.onRouteChanged(() => { void refresh_entity_overrides() })
  void refresh_entity_overrides()

  return () => {
    refresh_epoch += 1
    logseq.provideStyle({ key: 'logseq-plugin-bidi-override-badges', style: '' })
    observer.disconnect()
    off_route_changed()
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

export const has_native_bidi_support = (graph_document: Document): boolean => {
  graph_document.querySelectorAll('.ls-block > .block-main-container[dir="auto"][data-row-dir]').forEach((node) => {
    node.removeAttribute('dir')
    node.removeAttribute('data-row-dir')
  })
  return !!graph_document.querySelector('.ls-block > .block-main-container[data-row-dir]')
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
