import {
  row_item_fill_declarations,
  row_ltr_declarations,
  rtl_children_border_declarations,
  rtl_children_border_position_declarations,
  rtl_children_container_declarations,
  rtl_editor_text_important_declarations,
  rtl_row_layout_declarations
} from './css-declarations'

export const host_pr_parity_style = `
a.tag {
  unicode-bidi: plaintext;
}

.ls-block > .block-main-container {
${row_ltr_declarations}
}

.ls-block > .block-main-container > .block-control-wrap {
  order: 1;
}

.ls-block > .block-main-container > .block-main-content-wrap,
.ls-block > .block-main-container > .flex.flex-col.w-full:not(.block-control-wrap) {
  order: 2;
  min-width: 0;
  direction: ltr;
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) {
${rtl_row_layout_declarations}
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-control-wrap {
  order: 2;
  padding-inline: 0;
  flex-direction: row;
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-control-wrap > .block-control:has(.control-hide) {
  display: none;
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) {
  order: 1;
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-content-wrapper,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-content-wrapper {
  justify-content: flex-end;
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-content-wrapper > .block-content,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-content-wrapper > .block-content {
  flex: 0 1 auto;
  width: auto !important;
  max-width: 100%;
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-content,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-content-inner,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-head-wrap,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-content,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-content-inner,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-head-wrap {
  direction: rtl;
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-head-wrap,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-head-wrap {
  justify-content: flex-end;
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-content-or-editor-wrap,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-content-or-editor-wrap {
  flex-direction: row-reverse;
}

.ls-block > .block-main-container[data-row-dir="rtl"] textarea[id^="edit-block-"],
.ls-block > .block-main-container[data-row-dir="rtl"] #mock-text {
${rtl_editor_text_important_declarations}
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-row > .block-content-wrapper,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-row > .block-content-wrapper,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-row > .editor-wrapper,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-row > .editor-wrapper {
${row_item_fill_declarations}
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-row > .ls-block-right:empty,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-row > .ls-block-right:empty,
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .block-main-content-wrap .block-row > .ls-block-right:not(:has(> :not(:empty))),
.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) > .flex.flex-col.w-full:not(.block-control-wrap) .block-row > .ls-block-right:not(:has(> :not(:empty))) {
  display: none;
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) .block-children-container {
  margin-inline-start: 29px;
}

.ls-block:has(> .block-main-container[data-row-dir="rtl"]) > .block-children-container,
.ls-block:has(> .block-main-container textarea:dir(rtl)) > .block-children-container,
.ls-block:has(> .block-main-container #mock-text:dir(rtl)) > .block-children-container {
${rtl_children_container_declarations}
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) .block-children-left-border {
  left: auto;
  inset-inline-start: -1px;
  padding-inline-end: 0;
}

.ls-block:has(> .block-main-container[data-row-dir="rtl"]) > .block-children-container > .block-children-left-border,
.ls-block:has(> .block-main-container textarea:dir(rtl)) > .block-children-container > .block-children-left-border,
.ls-block:has(> .block-main-container #mock-text:dir(rtl)) > .block-children-container > .block-children-left-border {
${rtl_children_border_position_declarations}
}

.ls-block > .block-main-container:is([data-row-dir="rtl"], :has(textarea:dir(rtl)), :has(#mock-text:dir(rtl))) .block-children {
  border-left-width: 0 !important;
  border-inline-start-width: var(--ls-block-bullet-threading-width, 1px) !important;
  border-inline-start-color: var(--ls-guideline-color, var(--ls-bullet-threading-background-color, #ddd));
}

.ls-block:has(> .block-main-container[data-row-dir="rtl"]) > .block-children-container > .block-children,
.ls-block:has(> .block-main-container textarea:dir(rtl)) > .block-children-container > .block-children,
.ls-block:has(> .block-main-container #mock-text:dir(rtl)) > .block-children-container > .block-children {
${rtl_children_border_declarations}
}
`
