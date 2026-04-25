import type { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'

export type BidiSettings = {
  debug_logging: boolean
}

export const default_settings: BidiSettings = {
  debug_logging: false
}

export const settings_schema: SettingSchemaDesc[] = [
  {
    key: 'debug_logging',
    type: 'boolean',
    title: 'Enable debug logging',
    description: 'Print plugin debug messages in DevTools console',
    default: default_settings.debug_logging
  }
]

export const read_settings = (settings: Record<string, unknown> | undefined): BidiSettings => ({
  debug_logging: typeof settings?.debug_logging === 'boolean'
    ? settings.debug_logging
    : default_settings.debug_logging
})

export const log_debug = (settings: BidiSettings, message: string): void => {
  if (!settings.debug_logging) return
  console.debug(`[logseq-plugin-bidi] ${message}`)
}
