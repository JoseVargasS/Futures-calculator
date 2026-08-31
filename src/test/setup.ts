import "@testing-library/jest-dom";

// Mock TradingView global
class MockWidget {
  constructor(opts: Record<string, unknown>) {
    (MockWidget as unknown as { lastOpts?: Record<string, unknown> }).lastOpts = opts;
  }
}
(MockWidget as unknown as { lastOpts?: Record<string, unknown> }).lastOpts = undefined;

window.TradingView = { widget: MockWidget } as unknown as Window["TradingView"];

// helper to access last opts in tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as unknown as { __mockTradingViewLastOpts: () => unknown }).__mockTradingViewLastOpts = () =>
  (MockWidget as unknown as { lastOpts?: unknown }).lastOpts;
