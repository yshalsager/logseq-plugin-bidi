import assert from 'node:assert/strict'
import test from 'node:test'
import { set_block_direction_property } from './block-direction-menu'

const calls: Array<Array<unknown>> = []
const editor = {
  removeBlockProperty: async (...args: Array<unknown>) => { calls.push(['remove', ...args]) },
  upsertBlockProperty: async (...args: Array<unknown>) => { calls.push(['upsert-block', ...args]) },
  upsertProperty: async (...args: Array<unknown>) => { calls.push(['upsert-property', ...args]); return { id: 1 } }
} as Parameters<typeof set_block_direction_property>[0]

test('stores forced direction and removes the property for automatic direction', async () => {
  await set_block_direction_property(editor, 'block-id', 'rtl')
  await set_block_direction_property(editor, 'block-id', 'ltr')
  await set_block_direction_property(editor, 'block-id', 'auto')

  const schema = { type: 'default', cardinality: 'one', hide: true, public: false }
  assert.deepEqual(calls, [
    ['upsert-property', 'direction', schema],
    ['upsert-block', 'block-id', 'direction', 'rtl', { reset: true }],
    ['upsert-property', 'direction', schema],
    ['upsert-block', 'block-id', 'direction', 'ltr', { reset: true }],
    ['remove', 'block-id', 'direction']
  ])
})
