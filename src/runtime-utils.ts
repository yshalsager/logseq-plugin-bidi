export type Cleanup = () => void

export const create_debounced = (fn: () => void, wait_ms: number): { run: () => void; cancel: () => void } => {
  let timer_id: number | null = null

  const cancel = () => {
    if (timer_id !== null) {
      window.clearTimeout(timer_id)
      timer_id = null
    }
  }

  const run = () => {
    cancel()
    timer_id = window.setTimeout(() => {
      timer_id = null
      fn()
    }, wait_ms)
  }

  return { run, cancel }
}
