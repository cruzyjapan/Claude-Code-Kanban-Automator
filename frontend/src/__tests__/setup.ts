import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock WebSocket
class MockWebSocket {
  url: string
  readyState: number = 0
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 100)
  }

  send(data: string) {
    console.log('WebSocket send:', data)
  }

  close() {
    this.readyState = 3
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }
}

global.WebSocket = MockWebSocket as any

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://localhost:5000/api',
    VITE_WS_URL: 'ws://localhost:5000',
  },
}))