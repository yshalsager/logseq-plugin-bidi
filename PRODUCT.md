# Product

## Register

product

## Users

Logseq users writing Arabic, Hebrew, English, or mixed-direction notes on desktop and web. They need blocks, references, comments, and editors to read naturally without interrupting note-taking.

## Product Purpose

Provide dependable bidirectional text and RTL block layout where Logseq does not yet provide it natively. Automatic behavior should handle normal content; manual direction controls should correct ambiguous blocks quickly and persist through standard Logseq data.

## Brand Personality

Native, quiet, dependable.

## Anti-references

Custom floating toolbars, permanent direction controls on every block, global language modes, decorative UI, and plugin-specific state that cannot be inspected or edited as ordinary Logseq data.

## Design Principles

- Fit Logseq's existing interaction vocabulary instead of introducing a parallel interface.
- Keep automatic direction the default and manual correction one action away.
- Preserve native controls, source order, keyboard behavior, and accessibility.
- Store user intent in portable block properties rather than hidden plugin state.
- Defer to native Logseq bidi support whenever it becomes available.

## Accessibility & Inclusion

Meet WCAG 2.1 AA where the plugin introduces interaction. Direction actions must be keyboard accessible, screen-reader labeled, theme independent, and understandable without color or pointer-only interaction.
