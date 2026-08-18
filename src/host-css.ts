import {
  row_item_fill_declarations,
  row_ltr_declarations,
  rtl_children_border_declarations,
  rtl_children_border_position_declarations,
  rtl_children_container_declarations,
  rtl_row_layout_declarations
} from './css-declarations'

const outline_block = '.ls-block:not(.is-comments-area):not([data-is-property]):not([data-query]):not([data-transclude]):not([data-embed]):not(:has(> .block-main-container[data-row-dir]))'
const rtl_main_state = ':has(.block-content:dir(rtl), .block-content-inner:dir(rtl), .block-title-wrap:dir(rtl), textarea:dir(rtl), #mock-text:dir(rtl))'
const rtl_block_state = ':has(> .block-main-container .block-content:dir(rtl), > .block-main-container .block-content-inner:dir(rtl), > .block-main-container .block-title-wrap:dir(rtl), > .block-main-container textarea:dir(rtl), > .block-main-container #mock-text:dir(rtl))'

export const host_pr_parity_style = `
a.tag {
  unicode-bidi: plaintext;
}

${outline_block} > .block-main-container:not(:has(> .block-renderer-container)) {
${row_ltr_declarations}
}

${outline_block} > .block-main-container > .block-main-content-wrap:not(:has(.block-renderer-container)),
${outline_block} > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) {
  min-width: 0;
  direction: ltr;
}

${outline_block} > .block-main-container:not(:has(> .block-renderer-container))${rtl_main_state} {
${rtl_row_layout_declarations}
}

${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content-wrapper,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content-wrapper {
  justify-content: flex-end;
}

${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content-wrapper > .block-content,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content-wrapper > .block-content {
  flex: 0 1 auto;
  width: auto !important;
  max-width: 100%;
}

${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content,
${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content-inner,
${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-head-wrap,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content-inner,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-head-wrap {
  direction: rtl;
}

${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-head-wrap,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-head-wrap {
  justify-content: flex-end;
}

${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content-or-editor-wrap,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content-or-editor-wrap {
  flex-direction: row-reverse;
}

${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-row > .block-content-wrapper,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-row > .block-content-wrapper,
${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-row > .editor-wrapper,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-row > .editor-wrapper {
${row_item_fill_declarations}
}

${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-row > .ls-block-right:empty,
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-row > .ls-block-right:empty,
${outline_block} > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-row > .ls-block-right:not(:has(> :not(:empty))),
${outline_block} > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-row > .ls-block-right:not(:has(> :not(:empty))) {
  display: none;
}

${outline_block}${rtl_block_state} > .block-children-container {
${rtl_children_container_declarations}
}

${outline_block}${rtl_block_state} > .block-children-container > .block-children-left-border {
${rtl_children_border_position_declarations}
}

${outline_block}${rtl_block_state} > .block-children-container > .block-children {
${rtl_children_border_declarations}
}
`
