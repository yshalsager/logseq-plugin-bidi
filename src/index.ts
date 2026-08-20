import '@logseq/libs'
import { build_base_style } from './base-css'
import { install_block_direction_menu } from './block-direction-menu'
import {
  get_graph_document,
  has_native_bidi_support,
  install_host_direction_runtime
} from './desktop-runtime'
import { type Cleanup } from './runtime-utils'
import { log_debug, read_settings, settings_schema } from './settings'
import {
  clear_fallback_styles,
  install_fallback_direction_runtime
} from './web-fallback-runtime'

const style_key = 'logseq-plugin-bidi-style'

let runtime_cleanup_fns: Array<Cleanup> = []

const install_style = (host_dom_access: boolean): void => {
  logseq.provideStyle({
    key: style_key,
    style: build_base_style(!host_dom_access)
  })
}

const clear_runtime = (): void => {
  runtime_cleanup_fns.forEach((cleanup_fn) => cleanup_fn())
  runtime_cleanup_fns = []
  clear_fallback_styles()
}

const start_runtime = (): void => {
  const settings = read_settings(logseq.settings)
  const { graph_block_dom_available, graph_document, host_dom_access } = get_graph_document()

  if (graph_block_dom_available && has_native_bidi_support(graph_document)) {
    logseq.provideStyle({ key: style_key, style: '' })
    log_debug(settings, 'native Logseq bidi support detected; plugin runtime disabled')
    return
  }

  install_style(host_dom_access)

  if (!host_dom_access && !graph_block_dom_available) {
    runtime_cleanup_fns.push(install_fallback_direction_runtime(settings))
    log_debug(settings, 'host DOM inaccessible; installed per-block fallback runtime')
    return
  }

  runtime_cleanup_fns.push(install_host_direction_runtime(graph_document))

  log_debug(
    settings,
    `runtime started (host_dom_access=${String(host_dom_access)}, graph_block_dom_available=${String(graph_block_dom_available)})`
  )
}

const restart_runtime = (): void => {
  clear_runtime()
  start_runtime()
}

const main = async (): Promise<void> => {
  logseq.useSettingsSchema(settings_schema)

  restart_runtime()
  const cleanup_block_direction_menu = install_block_direction_menu(restart_runtime)

  const off_settings_changed = logseq.onSettingsChanged(() => {
    restart_runtime()
  })

  logseq.beforeunload(async () => {
    off_settings_changed()
    cleanup_block_direction_menu()
    clear_runtime()
    logseq.provideStyle({ key: style_key, style: '' })
  })
}

logseq.ready(main).catch((error) => {
  console.error('[logseq-plugin-bidi] startup failed', error)
  void logseq.UI.showMsg('Bidi plugin failed to start. Check DevTools for details.', 'error')
})
