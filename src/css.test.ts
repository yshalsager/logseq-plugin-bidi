import assert from 'node:assert/strict'
import test from 'node:test'
import {
  build_base_style
} from './base-css'
import {
  build_editor_override_css,
  build_page_title_css,
  build_rtl_blocks_css
} from './web-fallback-css'
import {
  css_attr_value,
  css_identifier_part
} from './css-utils'

const uuid = '69e6aaae-a0e9-4df8-aa55-1961e7c03f28'

test('escapes attribute values without changing uuid selectors', () => {
  assert.equal(css_attr_value(uuid), uuid)
  assert.match(build_rtl_blocks_css([uuid]), new RegExp(`\\.ls-block\\[blockid="${uuid}"\\] > \\.block-main-container \\{`))
})

test('escapes prefixed id selector fragments without corrupting leading digits', () => {
  assert.equal(css_identifier_part(uuid), uuid)
  const css = build_editor_override_css(uuid, 'rtl')
  assert.match(css, new RegExp(`#control-${uuid} \\{\\n  display: none;\\n\\}`))
  assert.match(css, new RegExp(`#edit-block-${uuid},\\n#editor-edit-block-${uuid} #mock-text \\{`))
})

test('generated rtl css hides collapse control and owns bullet geometry', () => {
  const css = build_rtl_blocks_css([uuid])
  assert.match(css, new RegExp(`#control-${uuid} \\{\\n  display: none;\\n\\}`))
  assert.match(css, /\.bullet-link-wrap \{\n  display: inline-flex !important;/)
  assert.match(css, /\.bullet-container \.bullet \{\n  display: block !important;/)
  assert.doesNotMatch(css, /#control-\\69/)
})

test('base style can include or omit web fallback css', () => {
  const desktop_css = build_base_style(false)
  const web_css = build_base_style(true)

  assert.match(desktop_css, /\.ls-block > \.block-main-container/)
  assert.doesNotMatch(desktop_css, /\.editor-inner textarea,\n#mock-text/)
  assert.match(web_css, /\.editor-inner textarea,\n#mock-text/)
  assert.match(web_css, /\.page-reference \{\n  direction: ltr;\n  unicode-bidi: isolate;/)
})

test('page title css is only generated for rtl titles', () => {
  assert.equal(build_page_title_css('ltr'), '')
  assert.equal(build_page_title_css('auto'), '')
  assert.match(build_page_title_css('rtl'), /\.ls-page-title \{\n  direction: rtl;/)
})

test('editor override css uses safe block selectors for both directions', () => {
  const rtl_css = build_editor_override_css(uuid, 'rtl')
  const ltr_css = build_editor_override_css(uuid, 'ltr')

  assert.match(rtl_css, new RegExp(`#edit-block-${uuid},\\n#editor-edit-block-${uuid} #mock-text \\{`))
  assert.match(rtl_css, new RegExp(`#control-${uuid} \\{\\n  display: none;\\n\\}`))
  assert.match(ltr_css, new RegExp(`#control-${uuid} \\{\\n  display: inline-flex;\\n\\}`))
  assert.doesNotMatch(rtl_css + ltr_css, /#edit-block-\\69/)
})
