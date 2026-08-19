import assert from 'node:assert/strict'
import test from 'node:test'
import { set_block_direction_property } from './block-direction-menu'

const calls: Array<Array<unknown>> = []
const editor = {
  removeBlockProperty: async (...args: Array<unknown>) => { calls.push(['remove', ...args]) },
  upsertBlockProperty: async (...args: Array<unknown>) => { calls.push(['upsert', ...args]) }
} as Parameters<typeof set_block_direction_property>[0]

test('stores forced direction and removes the property for automatic direction', async () => {
  await set_block_direction_property(editor, 'block-id', 'rtl')
  await set_block_direction_property(editor, 'block-id', 'ltr')
  await set_block_direction_property(editor, 'block-id', 'auto')

  assert.deepEqual(calls, [
    ['upsert', 'block-id', 'direction', 'rtl'],
    ['upsert', 'block-id', 'direction', 'ltr'],
    ['remove', 'block-id', 'direction']
  ])
})
