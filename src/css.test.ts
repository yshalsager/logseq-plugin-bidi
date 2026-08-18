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
import { host_pr_parity_style } from './host-css'

const uuid = '69e6aaae-a0e9-4df8-aa55-1961e7c03f28'

test('escapes attribute values without changing uuid selectors', () => {
  assert.equal(css_attr_value(uuid), uuid)
  const css = build_rtl_blocks_css([uuid])
  assert.match(css, new RegExp(`\\[blockid="${uuid}"\\]`))
  assert.equal(css.split(uuid).length - 1, 1)
})

test('escapes prefixed id selector fragments without corrupting leading digits', () => {
  assert.equal(css_identifier_part(uuid), uuid)
  const css = build_editor_override_css(uuid, 'rtl')
  assert.match(css, new RegExp(`#edit-block-${uuid},\\n#editor-edit-block-${uuid} #mock-text \\{`))
})

test('preserves current Logseq row order and excludes full-block renderers', () => {
  const web_css = build_rtl_blocks_css([uuid])

  assert.doesNotMatch(host_pr_parity_style, /\border:/)
  assert.doesNotMatch(web_css, /\border:/)
  assert.match(host_pr_parity_style, /flex-direction: row-reverse;/)
  assert.match(web_css, /flex-direction: row-reverse;/)
  assert.match(host_pr_parity_style, /\.block-main-container:not\(:has\(> \.block-renderer-container\)\)/)
  assert.doesNotMatch(host_pr_parity_style, /^\.ls-block(?!:not\(\.is-comments-area\))/m)
  assert.match(host_pr_parity_style, /\.flex\.flex-col\.w-full:not\(\.block-control-wrap\):not\(\.block-renderer-container\)/)
  assert.match(web_css, /\.ls-block:not\(:has\(> \.block-main-container > \.block-renderer-container\)\)/)
  assert.match(web_css, /&\.ls-block > \.block-main-container/)
  assert.match(web_css, /&\.block-content \{\n    direction: rtl !important;\n    text-align: right;/)
})

test('generated rtl css stays compact for large pages', () => {
  const block_ids = Array.from({ length: 1000 }, (_, index) => `00000000-0000-0000-0000-${String(index).padStart(12, '0')}`)
  assert.ok(Buffer.byteLength(build_rtl_blocks_css(block_ids)) < 100_000)
})

test('bidi css preserves native block controls', () => {
  const css = host_pr_parity_style + build_rtl_blocks_css([uuid])
  assert.doesNotMatch(css, /#control-|\.bullet-link-wrap|\.bullet-container|\.control-hide/)
  assert.doesNotMatch(css, /> \.block-control-wrap \{/)
})

test('base style can include or omit web fallback css', () => {
  const desktop_css = build_base_style(false)
  const web_css = build_base_style(true)

  assert.match(desktop_css, /\.ls-block:not\(\.is-comments-area\) > \.block-main-container/)
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
  assert.doesNotMatch(rtl_css + ltr_css, /#control-|\.bullet-link-wrap|\.bullet-container/)
  assert.doesNotMatch(rtl_css + ltr_css, /#edit-block-\\69/)
})
