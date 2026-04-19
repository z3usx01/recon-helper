/**
 * content.js — Recon Helper
 * Injected into every page. Collects all script src URLs and responds
 * to messages from popup.js requesting that list.
 */

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "getJSFiles") {
    try {
      const scripts = Array.from(document.querySelectorAll("script[src]"))
        .map(s => s.src)
        .filter(src => src && src.startsWith("http")); // filter out blob/data URIs

      // Deduplicate
      const unique = [...new Set(scripts)];
      sendResponse({ jsFiles: unique });
    } catch (err) {
      sendResponse({ jsFiles: [], error: err.message });
    }
  }
  // Return true to keep the message channel open for async response
  return true;
});
