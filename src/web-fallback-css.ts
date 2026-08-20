import { css_attr_value, css_identifier_part, css_rule } from './css-utils'
import {
  override_badge_declarations,
  row_item_fill_declarations,
  row_ltr_declarations,
  rtl_children_border_declarations,
  rtl_children_border_position_declarations,
  rtl_children_container_declarations,
  rtl_editor_text_declarations,
  rtl_row_layout_declarations
} from './css-declarations'

export const web_text_fallback_style = `
.ls-block .block-content,
.ls-block .block-content-inner,
.ls-block .block-title-wrap,
.ls-page-title,
.editor-inner textarea,
#mock-text {
  unicode-bidi: plaintext;
}

.page-reference {
  unicode-bidi: isolate;
}
`

const bidi_target_selector = (block_ids: Array<string>): string => `:is(
  .ls-block:not(.is-comments-area):not([data-comment-item]):not([data-is-property]):not([data-query]):not([data-transclude]):not([data-embed]):not(:has(> .block-main-container.is-page-title-row)):not(:has(> .block-main-container[data-row-dir])):not(:has(> .block-main-container > .block-renderer-container)),
  .ls-comment-body .block-content
):is(
${block_ids.map((block_id) => `  [blockid="${css_attr_value(block_id)}"]`).join(',\n')}
)`

const content_column_selector_list = (suffix = ''): string => (
  [
    `&.ls-block > .block-main-container > .block-main-content-wrap:not(:has(.block-renderer-container))${suffix}`,
    `&.ls-block > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container)${suffix}`
  ].join(',\n')
)

const content_text_selector_list = (): string => (
  [
    '.block-content',
    '.block-content-inner',
    '.block-title-wrap',
    '.block-head-wrap'
  ]
    .flatMap((suffix) => [
      `&.ls-block > .block-main-container > .block-main-content-wrap:not(:has(.block-renderer-container)) ${suffix}`,
      `&.ls-block > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) ${suffix}`
    ])
    .join(',\n')
)

const block_row_item_selector_list = (suffix: string): string => (
  [
    `&.ls-block > .block-main-container > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-row > ${suffix}`,
    `&.ls-block > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-row > ${suffix}`
  ].join(',\n')
)

const ltr_children_container_declarations = `  margin-left: 29px;
  margin-inline-start: 29px;
  margin-inline-end: 0;`

const ltr_children_border_position_declarations = `  left: -1px;
  right: auto;
  inset-inline-start: -1px;
  inset-inline-end: auto;`

const ltr_children_border_declarations = `  border-left-width: var(--ls-block-bullet-threading-width, 1px) !important;
  border-left-color: var(--ls-guideline-color, var(--ls-bullet-threading-background-color, #ddd));
  border-right-width: 0 !important;
  border-inline-start-width: var(--ls-block-bullet-threading-width, 1px) !important;
  border-inline-start-color: var(--ls-guideline-color, var(--ls-bullet-threading-background-color, #ddd));
  border-inline-end-width: 0 !important;`

const build_row_item_fill_css = (): string => (
  css_rule([
    block_row_item_selector_list('.block-content-wrapper'),
    block_row_item_selector_list('.editor-wrapper')
  ].join(',\n'), row_item_fill_declarations)
)

const build_children_thread_css = (
  container_declarations: string,
  border_position_declarations: string,
  border_declarations: string
): string => [
  css_rule('&.ls-block > .block-children-container', container_declarations),
  css_rule('&.ls-block > .block-children-container > .block-children-left-border', border_position_declarations),
  css_rule('&.ls-block > .block-children-container > .block-children', border_declarations)
].join('\n\n')

const nest_css = (rules: Array<string>): string => rules.join('\n\n').replace(/^/gm, '  ')

export const build_override_badges_css = (overrides: Map<string, 'rtl' | 'ltr' | 'auto'>): string => (
  (['rtl', 'ltr'] as const).map((direction) => {
    const block_ids = [...overrides].filter(([, value]) => value === direction).map(([block_id]) => block_id)
    return block_ids.length ? `
${bidi_target_selector(block_ids)} {
${nest_css([
  css_rule(content_column_selector_list(' .block-head-wrap > .w-full::after'), override_badge_declarations(`"${direction.toUpperCase()}"`))
])}
}
` : ''
  }).join('')
)

export const build_rtl_blocks_css = (block_ids: Array<string>): string => {
  if (!block_ids.length) return ''

  return `
${bidi_target_selector(block_ids)} {
${nest_css([
  css_rule('&.ls-block > .block-main-container', `${row_ltr_declarations}\n${rtl_row_layout_declarations}`),
  css_rule(content_column_selector_list(), `  flex: 1 1 0%;
  width: auto !important;
  min-width: 0;`),
  css_rule(content_column_selector_list(' .block-content-wrapper'), '  justify-content: flex-end;'),
  css_rule(content_column_selector_list(' .block-content-wrapper > .block-content'), `  flex: 0 1 auto;
  width: auto !important;
  max-width: 100%;`),
  css_rule(content_text_selector_list(), '  direction: rtl !important;'),
  css_rule('&.block-content', `  direction: rtl !important;
  text-align: right;
  unicode-bidi: plaintext;`),
  css_rule(content_column_selector_list(' .block-head-wrap'), '  justify-content: flex-end;'),
  css_rule(content_column_selector_list(' .block-content-or-editor-wrap'), '  flex-direction: row-reverse;'),
  build_row_item_fill_css(),
  css_rule([
    block_row_item_selector_list('.ls-block-right:empty'),
    block_row_item_selector_list('.ls-block-right:not(:has(> :not(:empty)))')
  ].join(',\n'), '  display: none;'),
  build_children_thread_css(
    rtl_children_container_declarations,
    rtl_children_border_position_declarations,
    rtl_children_border_declarations
  ),
  css_rule('&.ls-block textarea[id^="edit-block-"],\n&.ls-block #mock-text', rtl_editor_text_declarations)
])}
}
`
}

export const build_page_title_css = (direction: 'rtl' | 'ltr' | 'auto'): string => (
  direction === 'rtl'
    ? `
.ls-page-title {
  direction: rtl;
  text-align: right;
  unicode-bidi: plaintext;
}
`
    : ''
)

const build_ltr_block_css = (block_id: string): string => `
${bidi_target_selector([block_id])} {
${nest_css([
  css_rule('&.ls-block > .block-main-container', row_ltr_declarations),
  css_rule(content_column_selector_list(), `  flex: initial;
  width: 100%;
  min-width: 0;`),
  css_rule(content_column_selector_list(' .block-content-wrapper'), '  justify-content: flex-start;'),
  css_rule(content_text_selector_list(), '  direction: ltr !important;'),
  css_rule(content_column_selector_list(' .block-row'), '  flex-direction: row;'),
  build_row_item_fill_css(),
  build_children_thread_css(
    ltr_children_container_declarations,
    ltr_children_border_position_declarations,
    ltr_children_border_declarations
  )
])}
}
`

export const build_editor_override_css = (block_id: string, direction: 'rtl' | 'ltr'): string => {
  const text_align = direction === 'rtl' ? 'right' : 'left'
  const row_direction_style = direction === 'rtl'
    ? build_rtl_blocks_css([block_id])
    : build_ltr_block_css(block_id)

  return `
${row_direction_style}

#edit-block-${css_identifier_part(block_id)},
#editor-edit-block-${css_identifier_part(block_id)} #mock-text {
  direction: ${direction} !important;
  text-align: ${text_align} !important;
  unicode-bidi: plaintext;
}
`
}
