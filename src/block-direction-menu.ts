import { type TextDirection } from './direction'
import { type Cleanup } from './runtime-utils'

type DirectionPropertyEditor = Pick<typeof logseq.Editor, 'removeBlockProperty' | 'upsertBlockProperty'>

export const set_block_direction_property = (
  editor: DirectionPropertyEditor,
  block_id: string,
  direction: TextDirection
): Promise<void> => (
  direction === 'auto'
    ? editor.removeBlockProperty(block_id, 'direction')
    : editor.upsertBlockProperty(block_id, 'direction', direction)
)

export const install_block_direction_menu = (): Cleanup => {
  const unregisters = ([
    ['Automatic direction', 'auto'],
    ['Right-to-left direction', 'rtl'],
    ['Left-to-right direction', 'ltr']
  ] as const).map(([label, direction]) => logseq.Editor.registerBlockContextMenuItem(label, async ({ uuid }) => {
    try {
      await set_block_direction_property(logseq.Editor, uuid, direction)
    } catch (error) {
      console.error('[logseq-plugin-bidi] failed to set block direction', error)
      await logseq.UI.showMsg('Could not change block direction. Check DevTools for details.', 'error')
    }
  })).filter((unregister): unregister is () => void => typeof unregister === 'function')

  return () => unregisters.forEach((unregister) => unregister())
}
