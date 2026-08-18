export type Cleanup = () => void

export const create_serialized_runner = (on_error: (error: unknown) => void): {
  run: (task: () => Promise<void> | void) => void
  cancel: () => void
  is_active: () => boolean
} => {
  let active = true
  let queue = Promise.resolve()

  const is_active = (): boolean => active
  const run = (task: () => Promise<void> | void): void => {
    queue = queue.then(async () => {
      if (active) await task()
    }).catch(on_error)
  }

  return {
    run,
    cancel: () => { active = false },
    is_active
  }
}

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
