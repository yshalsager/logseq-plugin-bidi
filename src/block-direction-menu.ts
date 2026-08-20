import { type TextDirection } from './direction'
import { type Cleanup } from './runtime-utils'

type DirectionPropertyEditor = Pick<typeof logseq.Editor, 'removeBlockProperty' | 'upsertBlockProperty' | 'upsertProperty'>

export const set_block_direction_property = async (
  editor: DirectionPropertyEditor,
  block_id: string,
  direction: TextDirection
): Promise<void> => {
  if (direction === 'auto') return editor.removeBlockProperty(block_id, 'direction')
  await editor.upsertProperty('direction', { type: 'default', cardinality: 'one', hide: true, public: false })
  await editor.upsertBlockProperty(block_id, 'direction', direction, { reset: true })
}

export const install_block_direction_menu = (on_change: () => void): Cleanup => {
  const unregisters = ([
    ['Automatic direction', 'auto'],
    ['Right-to-left direction', 'rtl'],
    ['Left-to-right direction', 'ltr']
  ] as const).map(([label, direction]) => logseq.Editor.registerBlockContextMenuItem(label, async ({ uuid }) => {
    try {
      await set_block_direction_property(logseq.Editor, uuid, direction)
      on_change()
    } catch (error) {
      console.error('[logseq-plugin-bidi] failed to set block direction', error)
      await logseq.UI.showMsg('Could not change block direction. Check DevTools for details.', 'error')
    }
  })).filter((unregister): unregister is () => void => typeof unregister === 'function')

  return () => unregisters.forEach((unregister) => unregister())
}
