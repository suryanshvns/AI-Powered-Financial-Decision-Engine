import { createConsola } from 'consola'

export const logger = createConsola({
  defaults: { tag: 'app' },
  fancy: true,
  level: import.meta.env.DEV ? 4 : 3,
})

/** @param {string} scope Short tag for module-level logs (e.g. `api`, `state`). */
export const scopedLogger = scope => logger.withTag(scope)
