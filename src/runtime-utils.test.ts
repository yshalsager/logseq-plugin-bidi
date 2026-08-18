import assert from 'node:assert/strict'
import test from 'node:test'
import { create_serialized_runner } from './runtime-utils'

const next_turn = (): Promise<void> => new Promise((resolve) => setImmediate(resolve))

test('serialized runner prevents overlap and skips queued work after cancellation', async () => {
  const events: Array<string> = []
  let release_first = (): void => {}
  const first_pending = new Promise<void>((resolve) => { release_first = resolve })
  const runner = create_serialized_runner((error) => { throw error })

  runner.run(async () => {
    events.push('first-start')
    await first_pending
    events.push(runner.is_active() ? 'first-commit' : 'first-discard')
  })
  runner.run(() => { events.push('second-start') })

  await next_turn()
  assert.deepEqual(events, ['first-start'])

  runner.cancel()
  release_first()
  await next_turn()
  assert.deepEqual(events, ['first-start', 'first-discard'])
})
