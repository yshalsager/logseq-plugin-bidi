import assert from 'node:assert/strict'
import test from 'node:test'
import { block_id_from_node, flatten_block_tree, page_title_from_record, resolve_block_tree_tuples, row_dir_source_text } from './logseq-data'

test('block id reads current and namespaced uuid fields', () => {
  assert.equal(block_id_from_node({ uuid: 'plain' }), 'plain')
  assert.equal(block_id_from_node({ 'block/uuid': 'namespaced' }), 'namespaced')
  assert.equal(block_id_from_node({ id: 1 }), null)
})

test('flattens nested block trees and ignores tuple children', () => {
  const output = flatten_block_tree([
    {
      uuid: 'a',
      children: [
        { uuid: 'b' },
        ['uuid', 'tuple-child'],
        null
      ]
    },
    { uuid: 'c' }
  ])

  assert.deepEqual(output.map((block) => block.uuid), ['a', 'b', 'c'])
})

test('resolves SDK block UUID tuples before flattening', async () => {
  const tree = await resolve_block_tree_tuples([
    { uuid: 'parent', children: [['uuid', 'child']] }
  ], async (uuid) => uuid === 'child' ? { uuid, title: 'عربي' } : null)

  assert.deepEqual(flatten_block_tree(tree).map((block) => block.uuid), ['parent', 'child'])
})

test('page title prefers original and display names over normalized names', () => {
  assert.equal(page_title_from_record({ originalName: 'Original', name: 'name', title: 'Title' }), 'Original')
  assert.equal(page_title_from_record({ name: 'name', title: 'Title' }), 'Title')
  assert.equal(page_title_from_record({ title: 'Title' }), 'Title')
  assert.equal(page_title_from_record(null), null)
})

test('row source prefers visible block-reference text', () => {
  assert.equal(row_dir_source_text({ fullTitle: 'Visible عربي', title: '((uuid))', content: 'Legacy' }), 'Visible عربي')
  assert.equal(row_dir_source_text({ fullTitle: '   ', title: 'Current', content: 'Legacy' }), 'Current')
  assert.equal(row_dir_source_text({ content: 'Legacy' }), 'Legacy')
})
