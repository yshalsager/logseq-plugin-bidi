# Changelog

## [Unreleased]

### Fixed

- Left comment items and page-title rows under Logseq's native layout.
- Matched Logseq's compact nested-block indentation when fold controls are shown on the right.
- Scoped desktop DOM observation to Logseq's app container.

## [0.1.6] - 2026-08-20

### Added

- Added a subtle RTL/LTR badge to blocks with a manual direction override.

## [0.1.5] - 2026-08-20

### Added

- Added native block context-menu actions for automatic, right-to-left, and left-to-right direction overrides, stored as hidden Logseq properties.

### Fixed

- Applied hidden direction overrides consistently on desktop and web using Logseq's native property data.
- Replaced the previous property value when changing direction instead of accumulating hidden value blocks.

## [0.1.4] - 2026-08-18

### Fixed

- Prevented hot upgrades from v0.1.1 from mistaking plugin-owned row attributes for native Logseq bidi support and disabling the runtime.
- Removed only the legacy `dir="auto"` plus `data-row-dir` marker pair before native capability detection.

## [0.1.3] - 2026-08-18

### Fixed

- Preserved Logseq-owned `data-row-dir` attributes on comments-area and full-block renderer rows when native bidi support appears after plugin startup.
- Removed the obsolete direction cleanup that could interfere with Logseq's native row classification.

## [0.1.2] - 2026-08-18

### Fixed

- Preserved Logseq's source order and native block controls for commented, collapsed, ordered-list, icon, and future block-row actions.
- Restored right-side indentation and thread guidelines for nested RTL blocks.
- Excluded comments-area wrappers, properties, queries, embeds, transclusions, and full-block plugin renderers from ordinary row mirroring.
- Made Arabic and English comments resolve direction independently on desktop and web.
- Replaced script-range heuristics with browser-native Unicode first-strong detection, including weak characters, long prefixes, and supplementary-plane scripts.
- Normalized combined task, property, list, priority, link, and page-reference prefixes independent of order.
- Inferred web direction from visible block-reference and page-reference labels instead of raw UUIDs or normalized page names.
- Removed the forced LTR direction from Arabic and Hebrew page references.
- Prevented stale route, restart, editor, and unload work from restoring old directions or styles.
- Kept the last known-good web style when a transient refresh fails.
- Resolved SDK block UUID tuples before direction classification.

### Added

- Per-block `direction:: rtl`, `direction:: ltr`, and `direction:: auto` overrides.
- Capability detection that disables the plugin when Logseq provides native `data-row-dir` support.
- Pull-request and push validation, test typechecking, release-tag validation, and ZIP smoke checks.

### Changed

- Reduced generated CSS for 1,000 RTL blocks from several megabytes to about 57 KiB.
- Updated web styles incrementally from changed blocks and removed idle editor polling.
- Delegated desktop updates to `dir="auto"` and targeted mutation handling instead of page-wide rescans.
- Updated dependencies, including `@logseq/libs` 0.3.4.
