import {
  row_item_fill_declarations,
  row_ltr_declarations,
  rtl_children_border_declarations,
  rtl_children_border_position_declarations,
  rtl_children_container_declarations,
  rtl_row_layout_declarations
} from './css-declarations'

const rtl_main_state = ':has(.block-content:dir(rtl), .block-content-inner:dir(rtl), .block-title-wrap:dir(rtl), textarea:dir(rtl), #mock-text:dir(rtl))'
const rtl_block_state = ':has(> .block-main-container .block-content:dir(rtl), > .block-main-container .block-content-inner:dir(rtl), > .block-main-container .block-title-wrap:dir(rtl), > .block-main-container textarea:dir(rtl), > .block-main-container #mock-text:dir(rtl))'

export const host_pr_parity_style = `
a.tag {
  unicode-bidi: plaintext;
}

.ls-block:not(.is-comments-area) > .block-main-container:not(:has(> .block-renderer-container)) {
${row_ltr_declarations}
}

.ls-block:not(.is-comments-area) > .block-main-container > .block-main-content-wrap:not(:has(.block-renderer-container)),
.ls-block:not(.is-comments-area) > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) {
  min-width: 0;
  direction: ltr;
}

.ls-block:not(.is-comments-area) > .block-main-container:not(:has(> .block-renderer-container))${rtl_main_state} {
${rtl_row_layout_declarations}
}

.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content-wrapper,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content-wrapper {
  justify-content: flex-end;
}

.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content-wrapper > .block-content,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content-wrapper > .block-content {
  flex: 0 1 auto;
  width: auto !important;
  max-width: 100%;
}

.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content-inner,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-head-wrap,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content-inner,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-head-wrap {
  direction: rtl;
}

.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-head-wrap,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-head-wrap {
  justify-content: flex-end;
}

.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-content-or-editor-wrap,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-content-or-editor-wrap {
  flex-direction: row-reverse;
}

.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-row > .block-content-wrapper,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-row > .block-content-wrapper,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-row > .editor-wrapper,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-row > .editor-wrapper {
${row_item_fill_declarations}
}

.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-row > .ls-block-right:empty,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-row > .ls-block-right:empty,
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .block-main-content-wrap:not(:has(.block-renderer-container)) .block-row > .ls-block-right:not(:has(> :not(:empty))),
.ls-block:not(.is-comments-area) > .block-main-container${rtl_main_state} > .flex.flex-col.w-full:not(.block-control-wrap):not(.block-renderer-container) .block-row > .ls-block-right:not(:has(> :not(:empty))) {
  display: none;
}

.ls-block:not(.is-comments-area) > .block-main-container:not(:has(> .block-renderer-container))${rtl_main_state} .block-children-container {
  margin-inline-start: 29px;
}

.ls-block:not(.is-comments-area):not(:has(> .block-main-container > .block-renderer-container))${rtl_block_state} > .block-children-container {
${rtl_children_container_declarations}
}

.ls-block:not(.is-comments-area) > .block-main-container:not(:has(> .block-renderer-container))${rtl_main_state} .block-children-left-border {
  left: auto;
  inset-inline-start: -1px;
  padding-inline-end: 0;
}

.ls-block:not(.is-comments-area):not(:has(> .block-main-container > .block-renderer-container))${rtl_block_state} > .block-children-container > .block-children-left-border {
${rtl_children_border_position_declarations}
}

.ls-block:not(.is-comments-area) > .block-main-container:not(:has(> .block-renderer-container))${rtl_main_state} .block-children {
  border-left-width: 0 !important;
  border-inline-start-width: var(--ls-block-bullet-threading-width, 1px) !important;
  border-inline-start-color: var(--ls-guideline-color, var(--ls-bullet-threading-background-color, #ddd));
}

.ls-block:not(.is-comments-area):not(:has(> .block-main-container > .block-renderer-container))${rtl_block_state} > .block-children-container > .block-children {
${rtl_children_border_declarations}
}
`
