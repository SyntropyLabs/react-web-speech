import type { MicPermissionState } from '../types'
import { detectBrowserCapabilities } from './browser'

/**
 * Get the current microphone permission state
 * Uses Permissions API when available, falls back to 'prompt'
 *
 * @returns Promise resolving to permission state
 */
export async function getMicPermissionState(): Promise<MicPermissionState> {
  const { isSupported, supportsPermissionsAPI } = detectBrowserCapabilities()

  // If Speech API isn't supported, mic permission is irrelevant
  if (!isSupported) {
    return 'unsupported'
  }

  // Try Permissions API first
  if (supportsPermissionsAPI) {
    try {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })
      return result.state as MicPermissionState
    } catch {
      // Firefox and Safari throw TypeError for 'microphone'
      // Fall through to default
    }
  }

  // Default to 'prompt' - actual state will be known when user tries to start
  return 'prompt'
}

/**
 * Subscribe to permission state changes
 * Returns null if Permissions API doesn't support change events
 *
 * @param callback - Called when permission state changes
 * @returns Cleanup function, or null if not supported
 */
export function subscribeToPermissionChanges(
  callback: (state: MicPermissionState) => void
): (() => void) | null {
  const { supportsPermissionsAPI } = detectBrowserCapabilities()

  if (!supportsPermissionsAPI) {
    return null
  }

  let permissionStatus: PermissionStatus | null = null
  let changeHandler: (() => void) | null = null

  navigator.permissions
    .query({ name: 'microphone' as PermissionName })
    .then((status) => {
      permissionStatus = status
      changeHandler = () => {
        callback(status.state as MicPermissionState)
      }
      status.addEventListener('change', changeHandler)
    })
    .catch(() => {
      // Fail silently - not all browsers support this
    })

  // Return cleanup function
  return () => {
    if (permissionStatus && changeHandler) {
      permissionStatus.removeEventListener('change', changeHandler)
    }
  }
}

/**
 * Request microphone permission by attempting to access the device
 * This triggers the browser's permission prompt
 *
 * @returns Promise resolving to the new permission state
 */
export async function requestMicPermission(): Promise<MicPermissionState> {
  const { isSupported } = detectBrowserCapabilities()

  if (!isSupported) {
    return 'unsupported'
  }

  try {
    // Request access to the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Immediately stop all tracks - we just needed the permission
    stream.getTracks().forEach((track) => track.stop())

    return 'granted'
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return 'denied'
      }
    }
    // Other errors (NotFoundError, etc.) - treat as denied for simplicity
    return 'denied'
  }
}
