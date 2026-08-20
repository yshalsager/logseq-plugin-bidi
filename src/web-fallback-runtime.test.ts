import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collect_rtl_block_ids_from_tree,
  create_cached_page_ref_resolver,
  resolve_page_refs_in_text,
  update_rtl_block_ids
} from './web-fallback-logic'

const infer_direction = (text: string): 'rtl' | 'ltr' | 'auto' => {
  for (const char of text) {
    if (/[\u0621-\u064A]/.test(char)) return 'rtl'
    if (/[A-Za-z]/.test(char)) return 'ltr'
  }
  return 'auto'
}

test('collects rtl block ids from page-reference-only blocks', async () => {
  const block_ids = await collect_rtl_block_ids_from_tree([
    { uuid: 'ltr', content: '[[Test]]' },
    { uuid: 'rtl', content: '[[اختبار]]' },
    { uuid: 'target-label-rtl', content: '[[69ebc529-f796-4bf7-a828-8a8ab3044a66][اختبار]]' },
    { uuid: 'block-ref-rtl', title: '((69ebc529-f796-4bf7-a828-8a8ab3044a66))', fullTitle: 'اختبار' },
    { uuid: 'forced-rtl', content: 'direction:: rtl\nEnglish' },
    { uuid: 'forced-ltr', content: 'direction:: ltr\nعربي' },
    {
      uuid: 'parent',
      content: 'Parent',
      children: [
        { uuid: 'child-rtl', content: '[اختبار](https://example.com)' }
      ]
    }
  ], async () => null, infer_direction)

  assert.deepEqual(block_ids, ['rtl', 'target-label-rtl', 'block-ref-rtl', 'forced-rtl', 'child-rtl'])
})

test('resolves uuid-only page references before collecting rtl blocks', async () => {
  const resolve_page_ref = async (target: string): Promise<string | null> => (
    target === '69ebc529-f796-4bf7-a828-8a8ab3044a66' ? 'اختبار' : null
  )

  assert.equal(
    await resolve_page_refs_in_text('[[69ebc529-f796-4bf7-a828-8a8ab3044a66]]', resolve_page_ref),
    'اختبار'
  )

  const block_ids = await collect_rtl_block_ids_from_tree([
    { uuid: 'uuid-page-ref', content: '[[69ebc529-f796-4bf7-a828-8a8ab3044a66]]' },
    { uuid: 'english-before-ref', content: 'See [[69ebc529-f796-4bf7-a828-8a8ab3044a66]]' }
  ], resolve_page_ref, infer_direction)

  assert.deepEqual(block_ids, ['uuid-page-ref'])
})

test('caches repeated page reference resolution', async () => {
  let calls = 0
  const cached_resolver = create_cached_page_ref_resolver(async (target) => {
    calls += 1
    return target === '69ebc529-f796-4bf7-a828-8a8ab3044a66' ? 'اختبار' : null
  })

  assert.equal(
    await resolve_page_refs_in_text(
      '[[69ebc529-f796-4bf7-a828-8a8ab3044a66]] and [[69ebc529-f796-4bf7-a828-8a8ab3044a66]]',
      cached_resolver
    ),
    'اختبار and اختبار'
  )

  const block_ids = await collect_rtl_block_ids_from_tree([
    { uuid: 'first', content: '[[69ebc529-f796-4bf7-a828-8a8ab3044a66]]' },
    { uuid: 'second', content: '[[69ebc529-f796-4bf7-a828-8a8ab3044a66]]' }
  ], cached_resolver, infer_direction)

  assert.deepEqual(block_ids, ['first', 'second'])
  assert.equal(calls, 1)
})

test('updates only changed block directions', async () => {
  const rtl_block_ids = new Set(['unchanged-rtl', 'changed-to-ltr'])

  await update_rtl_block_ids(rtl_block_ids, [
    { uuid: 'changed-to-ltr', content: 'English now' },
    { uuid: 'changed-to-rtl', content: 'عربي الآن' }
  ], async () => null, infer_direction)

  assert.deepEqual([...rtl_block_ids].sort(), ['changed-to-rtl', 'unchanged-rtl'])
  assert.deepEqual(await collect_rtl_block_ids_from_tree(
    [{ uuid: 'db-property-rtl', title: 'English' }],
    async () => null,
    infer_direction,
    new Map([['db-property-rtl', 'rtl']])
  ), ['db-property-rtl'])
})

test('skips page reference resolution when prefix already fixes direction', async () => {
  let calls = 0
  const resolve_page_ref = async (): Promise<string | null> => {
    calls += 1
    return 'اختبار'
  }

  const block_ids = await collect_rtl_block_ids_from_tree([
    { uuid: 'english-before-ref', content: 'See [[69ebc529-f796-4bf7-a828-8a8ab3044a66]]' },
    { uuid: 'arabic-before-ref', content: 'عربي [[69ebc529-f796-4bf7-a828-8a8ab3044a66]]' }
  ], resolve_page_ref, infer_direction)

  assert.deepEqual(block_ids, ['arabic-before-ref'])
  assert.equal(calls, 0)
})
