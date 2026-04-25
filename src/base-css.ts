import { host_pr_parity_style } from './host-css'
import { web_text_fallback_style } from './web-fallback-css'

export const build_base_style = (use_web_text_fallback: boolean): string => (
  [
    host_pr_parity_style,
    use_web_text_fallback ? web_text_fallback_style : ''
  ].join('\n')
)
