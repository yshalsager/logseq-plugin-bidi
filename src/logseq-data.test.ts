import assert from 'node:assert/strict'
import test from 'node:test'
import { block_id_from_node, flatten_block_tree, page_title_from_record, row_dir_source_text } from './logseq-data'

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

test('page title prefers original name over normalized fields', () => {
  assert.equal(page_title_from_record({ originalName: 'Original', name: 'name', title: 'Title' }), 'Original')
  assert.equal(page_title_from_record({ name: 'name', title: 'Title' }), 'name')
  assert.equal(page_title_from_record({ title: 'Title' }), 'Title')
  assert.equal(page_title_from_record(null), null)
})

test('row source uses first non-blank block title field', () => {
  assert.equal(row_dir_source_text({ content: 'English', title: 'Fallback' }), 'English')
  assert.equal(row_dir_source_text({ content: '   ', title: 'Fallback' }), 'Fallback')
})
