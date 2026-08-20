import assert from 'node:assert/strict'
import test from 'node:test'
import {
  build_base_style
} from './base-css'
import {
  build_editor_override_css,
  build_override_badges_css,
  build_page_title_css,
  build_rtl_blocks_css
} from './web-fallback-css'
import {
  css_attr_value,
  css_identifier_part
} from './css-utils'
import { has_native_bidi_support } from './desktop-runtime'
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
  assert.match(host_pr_parity_style, /\.block-content:dir\(rtl\)/)
  assert.match(host_pr_parity_style, /:not\(:has\(> \.block-main-container\[data-row-dir\]\)\)/)
  assert.doesNotMatch(host_pr_parity_style, /\[data-row-dir="rtl"\]/)
  assert.match(web_css, /flex-direction: row-reverse;/)
  assert.match(host_pr_parity_style, /\.block-main-container:not\(:has\(> \.block-renderer-container\)\)/)
  assert.doesNotMatch(host_pr_parity_style, /^\.ls-block(?!:not\(\.is-comments-area\))/m)
  assert.match(host_pr_parity_style, /\.flex\.flex-col\.w-full:not\(\.block-control-wrap\):not\(\.block-renderer-container\)/)
  assert.match(web_css, /\.ls-block:not\(\[data-is-property\]\).*:not\(:has\(> \.block-main-container > \.block-renderer-container\)\)/)
  assert.match(host_pr_parity_style, /margin-inline-end: 29px;/)
  assert.match(host_pr_parity_style, /border-right-width: var\(--ls-block-bullet-threading-width/)
  assert.match(web_css, /&\.ls-block > \.block-children-container/)
  assert.match(web_css, /&\.ls-block > \.block-main-container/)
  assert.match(web_css, /&\.block-content \{\n    direction: rtl !important;\n    text-align: right;/)
})

test('detects native markers without mistaking v0.1.1 attributes for core support', () => {
  const removed: Array<string> = []
  const legacy_document = {
    querySelectorAll: () => [{ removeAttribute: (name: string) => removed.push(name) }],
    querySelector: () => null
  } as unknown as Document
  const native_document = {
    querySelectorAll: () => [],
    querySelector: () => ({})
  } as unknown as Document

  assert.equal(has_native_bidi_support(legacy_document), false)
  assert.deepEqual(removed, ['dir', 'data-row-dir'])
  assert.equal(has_native_bidi_support(native_document), true)
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

  assert.match(desktop_css, /\.ls-block:not\(\.is-comments-area\):not\(\[data-is-property\]\):not\(\[data-query\]\)/)
  assert.doesNotMatch(desktop_css, /\.editor-inner textarea,\n#mock-text/)
  assert.match(web_css, /\.editor-inner textarea,\n#mock-text/)
  assert.match(web_css, /\.page-reference \{\n  unicode-bidi: isolate;/)
  assert.doesNotMatch(web_css, /\.page-reference \{\n  direction:/)
})

test('override badges identify forced direction without custom theme styling', () => {
  const css = build_override_badges_css(new Map([[uuid, 'rtl'], ['ltr-id', 'ltr']]))
  assert.match(css, /content: "RTL";/)
  assert.match(css, /content: "LTR";/)
  assert.doesNotMatch(css, /background:|color:|border:/)
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
