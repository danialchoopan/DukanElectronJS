import type { BroAppAPI } from '../src/preload/index'

declare global {
  interface Window {
    api: BroAppAPI
  }
}

export {}
