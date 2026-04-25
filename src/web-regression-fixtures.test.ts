import assert from 'node:assert/strict'
import test from 'node:test'
import { build_rtl_blocks_css } from './web-fallback-css'
import { collect_rtl_block_ids_from_tree } from './web-fallback-logic'

const arabic_page_ref_uuid = '69ebc529-f796-4bf7-a828-8a8ab3044a66'

const resolve_page_ref = async (target: string): Promise<string | null> => (
  target === arabic_page_ref_uuid ? 'اختبار' : null
)

test('web fallback classifies realistic bidi page blocks', async () => {
  const rtl_block_ids = await collect_rtl_block_ids_from_tree([
    { uuid: 'english', content: 'English is correct' },
    { uuid: 'arabic', content: 'لغة عربية' },
    { uuid: 'english-leading-mixed', content: 'Mixed English with عربي' },
    { uuid: 'arabic-leading-mixed', content: 'عربي with mixed english' },
    { uuid: 'arabic-indic-digits', content: '١٢٣' },
    { uuid: 'arabic-page-ref-label', content: `[[${arabic_page_ref_uuid}][اختبار]]` },
    { uuid: 'arabic-page-ref-uuid', content: `[[${arabic_page_ref_uuid}]]` },
    { uuid: 'english-before-page-ref', content: `See [[${arabic_page_ref_uuid}]]` },
    {
      uuid: 'nested-rtl-parent',
      content: 'مستوى',
      children: [
        {
          uuid: 'nested-rtl-child',
          content: 'تفرع',
          children: [
            { uuid: 'nested-rtl-grandchild', content: 'ثالث' }
          ]
        }
      ]
    }
  ], resolve_page_ref)

  assert.deepEqual(rtl_block_ids, [
    'arabic',
    'arabic-leading-mixed',
    'arabic-indic-digits',
    'arabic-page-ref-label',
    'arabic-page-ref-uuid',
    'nested-rtl-parent',
    'nested-rtl-child',
    'nested-rtl-grandchild'
  ])
})

test('web fallback css targets only rtl fixture blocks and preserves bullets', () => {
  const css = build_rtl_blocks_css(['arabic', 'arabic-page-ref-uuid', 'nested-rtl-child'])

  assert.match(css, /#control-arabic,/)
  assert.match(css, /#control-arabic-page-ref-uuid,/)
  assert.match(css, /#control-nested-rtl-child \{\n  display: none;\n\}/)
  assert.match(css, /\.ls-block\[blockid="nested-rtl-child"\] > \.block-main-container > \.block-control-wrap/)
  assert.match(css, /\.bullet-link-wrap \{\n  display: inline-flex !important;/)
  assert.match(css, /\.bullet-container \.bullet \{\n  display: block !important;/)
  assert.doesNotMatch(css, /#control-english\b/)
  assert.doesNotMatch(css, /#control-english-leading-mixed\b/)
})
