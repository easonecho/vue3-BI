/** Size (px) of the ruler strip (width for horizontal, height for vertical) */
export const RULER_SIZE = 42

/** Extra CSS-space padding inside the content layer so negative business coords map to positive CSS positions */
export const DISPLAY_OFFSET = 50000

/** Zoom bounds */
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 5

/** Dark ruler theme (matches previous SketchRuler palette) */
export const RULER_BG_COLOR = '#374151'
export const RULER_LINE_COLOR = '#9ca3af'
export const RULER_TEXT_COLOR = '#d1d5db'

/**
 * Unified color for user-defined guides (from @scena/guides) AND smart-guide snap alignment lines.
 * Keeps the visual language consistent: both kinds of "reference lines" share the same blue (#409eff).
 */
export const GUIDE_LINE_COLOR = '#409eff'

/** Distance (business pixels) within which smart guides snap and show alignment lines */
export const SNAP_THRESHOLD = 6

/** Large extent for snap lines so they visually span beyond the canvas sheet in any direction */
export const SNAP_LINE_EXTENT = 200000
