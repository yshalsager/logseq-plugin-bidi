import { css_attr_value, css_identifier_part, css_rule } from './css-utils'
import {
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
  direction: ltr;
  unicode-bidi: isolate;
}
`

const block_selector_list = (block_ids: Array<string>, suffix = ''): string => (
  block_ids.map((block_id) => `.ls-block[blockid="${css_attr_value(block_id)}"]${suffix}`).join(',\n')
)

const control_selector_list = (block_ids: Array<string>): string => (
  block_ids.map((block_id) => `#control-${css_identifier_part(block_id)}`).join(',\n')
)

const edit_selector_list = (block_ids: Array<string>): string => (
  block_ids
    .flatMap((block_id) => [
      `#edit-block-${css_identifier_part(block_id)}`,
      `#editor-edit-block-${css_identifier_part(block_id)} #mock-text`
    ])
    .join(',\n')
)

const content_column_selector_list = (block_ids: Array<string>, suffix = ''): string => (
  [
    block_selector_list(block_ids, ` > .block-main-container > .block-main-content-wrap${suffix}`),
    block_selector_list(block_ids, ` > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap)${suffix}`)
  ].join(',\n')
)

const content_text_selector_list = (block_ids: Array<string>): string => (
  [
    '.block-content',
    '.block-content-inner',
    '.block-title-wrap',
    '.block-head-wrap'
  ]
    .flatMap((suffix) => [
      block_selector_list(block_ids, ` > .block-main-container > .block-main-content-wrap ${suffix}`),
      block_selector_list(block_ids, ` > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap) ${suffix}`)
    ])
    .join(',\n')
)

const block_row_item_selector_list = (block_ids: Array<string>, suffix: string): string => (
  [
    block_selector_list(block_ids, ` > .block-main-container > .block-main-content-wrap .block-row > ${suffix}`),
    block_selector_list(block_ids, ` > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap) .block-row > ${suffix}`)
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

const build_row_item_fill_css = (block_ids: Array<string>): string => (
  css_rule([
    block_row_item_selector_list(block_ids, '.block-content-wrapper'),
    block_row_item_selector_list(block_ids, '.editor-wrapper')
  ].join(',\n'), row_item_fill_declarations)
)

const build_children_thread_css = (
  block_ids: Array<string>,
  container_declarations: string,
  border_position_declarations: string,
  border_declarations: string
): string => (
  [
    css_rule(block_selector_list(block_ids, ' .block-children-container'), container_declarations),
    css_rule(block_selector_list(block_ids, ' .block-children-left-border'), border_position_declarations),
    css_rule(block_selector_list(block_ids, ' .block-children'), border_declarations)
  ].join('\n\n')
)

export const build_rtl_blocks_css = (block_ids: Array<string>): string => {
  if (!block_ids.length) return ''

  return `
${css_rule(block_selector_list(block_ids, ' > .block-main-container'), `${row_ltr_declarations}
${rtl_row_layout_declarations}`)}

${css_rule(block_selector_list(block_ids, ' > .block-main-container > .block-control-wrap'), `  order: 2;
  flex: 0 0 16px;
  width: 16px;
  justify-content: center;
  align-self: flex-start;
  padding-inline: 0;
  flex-direction: row;
  gap: 0;
  opacity: 1;
  visibility: visible;`)}

${css_rule(control_selector_list(block_ids), '  display: none;')}

${css_rule(block_selector_list(block_ids, ' > .block-main-container > .block-control-wrap > .bullet-link-wrap'), `  display: inline-flex !important;
  opacity: 1;
  visibility: visible;
  width: 16px;
  min-width: 16px;
  height: 24px;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
  position: static;`)}

${css_rule(block_selector_list(block_ids, ' > .block-main-container > .block-control-wrap > .bullet-link-wrap .bullet-container'), `  display: inline-flex !important;
  opacity: 1;
  visibility: visible;
  width: 16px !important;
  min-width: 16px !important;
  height: 16px !important;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  align-self: center;
  margin: 0;
  padding: 0;
  line-height: 1;`)}

${css_rule(block_selector_list(block_ids, ' > .block-main-container > .block-control-wrap > .bullet-link-wrap .bullet-container .bullet'), `  display: block !important;
  opacity: 0.8;
  width: 6px !important;
  height: 6px !important;
  min-width: 6px !important;
  border-radius: 9999px;
  background-color: var(--lx-gray-08, var(--ls-block-bullet-color, var(--rx-gray-08))) !important;`)}

${css_rule(content_column_selector_list(block_ids), `  order: 1;
  flex: 1 1 0%;
  width: auto !important;
  min-width: 0;`)}

${css_rule(content_column_selector_list(block_ids, ' .block-content-wrapper'), '  justify-content: flex-end;')}

${css_rule(content_column_selector_list(block_ids, ' .block-content-wrapper > .block-content'), `  flex: 0 1 auto;
  width: auto !important;
  max-width: 100%;`)}

${css_rule(content_text_selector_list(block_ids), '  direction: rtl !important;')}

${css_rule(content_column_selector_list(block_ids, ' .block-head-wrap'), '  justify-content: flex-end;')}

${css_rule(content_column_selector_list(block_ids, ' .block-content-or-editor-wrap'), '  flex-direction: row-reverse;')}

${build_row_item_fill_css(block_ids)}

${css_rule([
  block_row_item_selector_list(block_ids, '.ls-block-right:empty'),
  block_row_item_selector_list(block_ids, '.ls-block-right:not(:has(> :not(:empty)))')
].join(',\n'), '  display: none;')}

${build_children_thread_css(
  block_ids,
  rtl_children_container_declarations,
  rtl_children_border_position_declarations,
  rtl_children_border_declarations
)}

${css_rule(edit_selector_list(block_ids), rtl_editor_text_declarations)}
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

const build_ltr_block_css = (block_id: string): string => {
  const block_ids = [block_id]

  return `
${css_rule(block_selector_list(block_ids, ' > .block-main-container'), row_ltr_declarations)}

${css_rule(block_selector_list(block_ids, ' > .block-main-container > .block-control-wrap'), `  order: 1;
  flex: initial;
  width: auto;
  justify-content: initial;
  align-self: initial;
  padding-inline: initial;
  flex-direction: row;`)}

${css_rule(control_selector_list(block_ids), '  display: inline-flex;')}

${css_rule(content_column_selector_list(block_ids), `  order: 2;
  flex: initial;
  width: 100%;
  min-width: 0;`)}

${css_rule(content_column_selector_list(block_ids, ' .block-content-wrapper'), '  justify-content: flex-start;')}

${css_rule(content_text_selector_list(block_ids), '  direction: ltr !important;')}

${css_rule(content_column_selector_list(block_ids, ' .block-row'), '  flex-direction: row;')}

${build_row_item_fill_css(block_ids)}

${build_children_thread_css(
  block_ids,
  ltr_children_container_declarations,
  ltr_children_border_position_declarations,
  ltr_children_border_declarations
)}
`
}

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
