import assert from 'node:assert/strict'
import test from 'node:test'
import { default_settings, read_settings, settings_schema } from './settings'

test('settings expose only debug logging', () => {
  assert.deepEqual(settings_schema.map((setting) => setting.key), ['debug_logging'])
})

test('read settings ignores removed advanced toggles', () => {
  assert.deepEqual(
    read_settings({
      debug_logging: true,
      enable_block_auto_dir: false,
      enable_editor_auto_dir: false,
      enable_minimal_css: false,
      override_existing_dir: true
    }),
    { debug_logging: true }
  )

  assert.deepEqual(read_settings(undefined), default_settings)
})
