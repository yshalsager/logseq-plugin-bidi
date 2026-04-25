export const row_ltr_declarations = `  direction: ltr;
  flex-direction: row;
  unicode-bidi: isolate;`

export const rtl_row_layout_declarations = `  flex-direction: row;
  gap: 0;
  column-gap: 0;`

export const row_item_fill_declarations = `  flex: 1 1 0%;
  min-width: 0;`

export const rtl_editor_text_declarations = `  direction: rtl;
  text-align: right;
  unicode-bidi: plaintext;`

export const rtl_editor_text_important_declarations = `  direction: rtl !important;
  text-align: right !important;
  unicode-bidi: plaintext;`

export const rtl_children_container_declarations = `  margin-left: 0;
  margin-inline-start: 0;
  margin-inline-end: 29px;`

export const rtl_children_border_position_declarations = `  left: auto;
  right: -1px;
  inset-inline-start: auto;
  inset-inline-end: -1px;`

export const rtl_children_border_declarations = `  border-left-width: 0 !important;
  border-right-width: var(--ls-block-bullet-threading-width, 1px) !important;
  border-right-color: var(--ls-guideline-color, var(--ls-bullet-threading-background-color, #ddd));
  border-inline-start-width: 0 !important;
  border-inline-end-width: var(--ls-block-bullet-threading-width, 1px) !important;
  border-inline-end-color: var(--ls-guideline-color, var(--ls-bullet-threading-background-color, #ddd));`
