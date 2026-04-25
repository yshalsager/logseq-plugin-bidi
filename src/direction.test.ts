import assert from 'node:assert/strict'
import test from 'node:test'
import { extract_page_ref_spans, infer_text_direction } from './direction'

test('infers first strong direction for basic block text', () => {
  assert.equal(infer_text_direction('English is correct'), 'ltr')
  assert.equal(infer_text_direction('لغة عربية'), 'rtl')
  assert.equal(infer_text_direction('Mixed English with عربي'), 'ltr')
  assert.equal(infer_text_direction('عربي with mixed english'), 'rtl')
})

test('keeps Arabic-Indic digits as rtl', () => {
  assert.equal(infer_text_direction('١٢٣'), 'rtl')
  assert.equal(infer_text_direction('١٢٣ عربي'), 'rtl')
})

test('ignores common Logseq prefixes before detecting direction', () => {
  assert.equal(infer_text_direction('TODO: لغة عربية'), 'rtl')
  assert.equal(infer_text_direction('- *   test'), 'ltr')
})

test('infers direction from visible link and page-reference labels', () => {
  assert.equal(infer_text_direction('[[اختبار]]'), 'rtl')
  assert.equal(infer_text_direction('[[Test]]'), 'ltr')
  assert.equal(infer_text_direction('[[69ebc529-f796-4bf7-a828-8a8ab3044a66][اختبار]]'), 'rtl')
  assert.equal(infer_text_direction('[[69ebc529-f796-4bf7-a828-8a8ab3044a66][Test]]'), 'ltr')
  assert.equal(infer_text_direction('[اختبار](https://example.com)'), 'rtl')
  assert.equal(infer_text_direction('[Test](https://example.com/اختبار)'), 'ltr')
})

test('extracts page-reference targets and visible labels', () => {
  const text = 'before [[69ebc529-f796-4bf7-a828-8a8ab3044a66][اختبار]] after'
  assert.deepEqual(
    extract_page_ref_spans(text).map((ref) => ({
      label: ref.label,
      raw: text.slice(ref.start_idx, ref.end_idx),
      target: ref.target
    })),
    [{
      label: 'اختبار',
      raw: '[[69ebc529-f796-4bf7-a828-8a8ab3044a66][اختبار]]',
      target: '69ebc529-f796-4bf7-a828-8a8ab3044a66'
    }]
  )
})
