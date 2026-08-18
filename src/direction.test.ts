import assert from 'node:assert/strict'
import test from 'node:test'
import { create_text_direction_probe, extract_page_ref_spans } from './direction'

const first_strong_direction = (text: string): 'rtl' | 'ltr' | null => {
  for (const char of text) {
    if (!/\p{Letter}/u.test(char)) continue
    return /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Adlam}]/u.test(char) ? 'rtl' : 'ltr'
  }
  return null
}

const create_fake_document = (): Document => {
  const create_element = () => ({
    dir: '',
    parent: null as { dir: string } | null,
    style: { cssText: '' },
    textContent: '',
    append(child: { parent: { dir: string } | null }) { child.parent = this },
    remove() {}
  })
  const body = create_element()

  return {
    body,
    createElement: create_element,
    defaultView: {
      getComputedStyle(element: { parent: { dir: string } | null; textContent: string }) {
        return { direction: first_strong_direction(element.textContent) ?? element.parent?.dir ?? 'ltr' }
      }
    },
    documentElement: body
  } as unknown as Document
}

const direction_probe = create_text_direction_probe(create_fake_document())
const infer_direction = direction_probe.infer_direction

test('delegates first-strong direction to the browser', () => {
  assert.equal(infer_direction('English is correct'), 'ltr')
  assert.equal(infer_direction('لغة عربية'), 'rtl')
  assert.equal(infer_direction('Mixed English with عربي'), 'ltr')
  assert.equal(infer_direction('عربي with mixed english'), 'rtl')
})

test('ignores weak characters and scans the full Unicode string', () => {
  assert.equal(infer_direction('،'), 'auto')
  assert.equal(infer_direction('ّ'), 'auto')
  assert.equal(infer_direction('١٢٣'), 'auto')
  assert.equal(infer_direction(`${'1'.repeat(300)}Aعربي`), 'ltr')
  assert.equal(infer_direction('𞤢𞤣𞤤𞤢𞤥'), 'rtl')
  assert.equal(infer_direction('ქართული'), 'ltr')
})

test('ignores common Logseq prefixes before detecting direction', () => {
  assert.equal(infer_direction('TODO: لغة عربية'), 'rtl')
  assert.equal(infer_direction('- *   test'), 'ltr')
})

test('infers direction from visible link and page-reference labels', () => {
  assert.equal(infer_direction('[[اختبار]]'), 'rtl')
  assert.equal(infer_direction('[[Test]]'), 'ltr')
  assert.equal(infer_direction('[[69ebc529-f796-4bf7-a828-8a8ab3044a66][اختبار]]'), 'rtl')
  assert.equal(infer_direction('[[69ebc529-f796-4bf7-a828-8a8ab3044a66][Test]]'), 'ltr')
  assert.equal(infer_direction('[اختبار](https://example.com)'), 'rtl')
  assert.equal(infer_direction('[Test](https://example.com/اختبار)'), 'ltr')
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
