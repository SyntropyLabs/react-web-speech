import { useSyncExternalStore } from 'react'

/**
 * Subscribe function that does nothing (client is always "subscribed")
 */
const subscribe = (): (() => void) => () => {}

/**
 * Client snapshot: we're NOT on the server
 */
const getSnapshot = (): boolean => false

/**
 * Server snapshot: we ARE on the server
 */
const getServerSnapshot = (): boolean => true

/**
 * Hook to detect if we're rendering on the server
 * Uses useSyncExternalStore for proper React 18 SSR support
 *
 * @internal This hook is for internal use only
 */
export function useIsSSR(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
