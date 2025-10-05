// Suppress hydration warnings ASAP
(function () {
  if (typeof window === "undefined") return;

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = function (...args) {
    const msg = args[0]?.toString() || "";
    if (
      msg.includes("Extra attributes from the server") ||
      msg.includes("bis_skin_checked") ||
      msg.includes("Hydration failed") ||
      msg.includes("error while hydrating")
    ) {
      return;
    }
    return originalError(...args);
  };

  console.warn = function (...args) {
    const msg = args[0]?.toString() || "";
    if (
      msg.includes("Extra attributes from the server") ||
      msg.includes("bis_skin_checked")
    ) {
      return;
    }
    return originalWarn(...args);
  };

  // Suppress Vercel Analytics debug logs in development
  const originalLog = console.log.bind(console);
  console.log = function (...args) {
    const msg = args[0]?.toString() || "";
    if (
      msg.includes("[Vercel Web Analytics]") ||
      msg.includes("Debug mode is enabled") ||
      msg.includes("Running queued event") ||
      msg.includes("[pageview]")
    ) {
      return;
    }
    return originalLog(...args);
  };
})();
