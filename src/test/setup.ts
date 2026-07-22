import '@testing-library/jest-dom'

// Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserver as unknown as typeof globalThis.ResizeObserver
}
