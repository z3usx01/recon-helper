/**
 * popup.js — Recon Helper
 * Orchestrates all data extraction, DNS resolution, and UI rendering.
 */

"use strict";

// ─── Utility: parse URL parts ─────────────────────────────────────────────────

function parseURL(rawURL) {
  try {
    const url = new URL(rawURL);
    const hostname = url.hostname; // e.g. admin.example.com
    const parts = hostname.split(".");
    const rootDomain =
      parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
    const subdomain =
      parts.length > 2 ? parts.slice(0, -2).join(".") : null;

    return {
      full: rawURL,
      protocol: url.protocol.replace(":", ""),
      hostname,
      rootDomain,
      subdomain,
      isHTTPS: url.protocol === "https:",
    };
  } catch {
    return null;
  }
}

// ─── Utility: resolve IP via Google DNS-over-HTTPS ───────────────────────────

async function resolveIP(hostname) {
  const endpoint = `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const answers = data.Answer || [];
    const aRecord = answers.find(r => r.type === 1); // type 1 = A record
    return aRecord ? aRecord.data : null;
  } catch (err) {
    return null;
  }
}

// ─── Utility: copy text to clipboard ─────────────────────────────────────────

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = "✓ Copied";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 1500);
  } catch {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function setField(id, value, fallback = "—") {
  const el = document.getElementById(id);
  if (el) el.textContent = value || fallback;
}

function showError(msg) {
  const el = document.getElementById("error-banner");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}

function openTab(url) {
  chrome.tabs.create({ url, active: true });
}

// ─── Recon tool URLs ──────────────────────────────────────────────────────────

function buildReconLinks(hostname, rootDomain) {
  return {
    shodan: `https://www.shodan.io/search?query=${encodeURIComponent(hostname)}`,
    wayback: `https://web.archive.org/web/*/${encodeURIComponent(hostname)}`,
    whois: `https://who.is/whois/${encodeURIComponent(rootDomain)}`,
    crtsh: `https://crt.sh/?q=${encodeURIComponent("%" + rootDomain)}`,
    securitytrails: `https://securitytrails.com/domain/${encodeURIComponent(rootDomain)}/history`,
    urlscan: `https://urlscan.io/search/#page.domain%3A${encodeURIComponent(hostname)}`,
  };
}

// ─── Render JS files list ─────────────────────────────────────────────────────

function renderJSFiles(files) {
  const container = document.getElementById("js-list");
  const countEl = document.getElementById("js-count");

  if (!files || files.length === 0) {
    container.innerHTML = `<div class="empty-state">No external JS files detected.</div>`;
    if (countEl) countEl.textContent = "0";
    return;
  }

  if (countEl) countEl.textContent = files.length;

  container.innerHTML = files
    .map(
      (src, i) => `
    <div class="js-item" title="${src}">
      <span class="js-index">${i + 1}</span>
      <a href="${src}" target="_blank" rel="noopener noreferrer" class="js-link">${src}</a>
      <button class="copy-mini" data-src="${src}" title="Copy URL">⎘</button>
    </div>`
    )
    .join("");

  // Bind copy buttons for JS files
  container.querySelectorAll(".copy-mini").forEach(btn => {
    btn.addEventListener("click", () => copyToClipboard(btn.dataset.src, btn));
  });
}

// ─── Main init ────────────────────────────────────────────────────────────────

async function init() {
  // 1. Get active tab
  let tab;
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = activeTab;
  } catch (err) {
    showError("Could not access current tab.");
    return;
  }

  const rawURL = tab?.url || "";

  // Handle special pages (chrome://, about:, etc.)
  if (!rawURL.startsWith("http://") && !rawURL.startsWith("https://")) {
    showError("Recon Helper only works on HTTP/HTTPS pages.");
    setField("full-url", rawURL);
    return;
  }

  // 2. Parse URL
  const parsed = parseURL(rawURL);
  if (!parsed) {
    showError("Failed to parse the page URL.");
    return;
  }

  // 3. Populate URL info fields
  setField("full-url", parsed.full);
  setField("hostname", parsed.hostname);
  setField("root-domain", parsed.rootDomain);
  setField(
    "subdomain",
    parsed.subdomain || "(none)",
    "(none)"
  );

  // Protocol badge
  const protoBadge = document.getElementById("protocol-badge");
  if (protoBadge) {
    protoBadge.textContent = parsed.protocol.toUpperCase();
    protoBadge.className = `protocol-badge ${parsed.isHTTPS ? "https" : "http"}`;
  }

  // HTTPS indicator
  const tlsIndicator = document.getElementById("tls-indicator");
  if (tlsIndicator) {
    tlsIndicator.textContent = parsed.isHTTPS
      ? "🔒 TLS Encrypted"
      : "⚠️ Not Encrypted";
    tlsIndicator.className = `tls-indicator ${parsed.isHTTPS ? "secure" : "insecure"}`;
  }

  // 4. Copy buttons for domain + URL
  document.getElementById("copy-url")?.addEventListener("click", e =>
    copyToClipboard(parsed.full, e.currentTarget)
  );
  document.getElementById("copy-domain")?.addEventListener("click", e =>
    copyToClipboard(parsed.hostname, e.currentTarget)
  );

  // 5. Resolve IP (async — show loading state)
  const ipEl = document.getElementById("ip-address");
  const copyIPBtn = document.getElementById("copy-ip");

  if (ipEl) ipEl.textContent = "Resolving…";

  resolveIP(parsed.hostname).then(ip => {
    if (ip) {
      if (ipEl) ipEl.textContent = ip;
      if (copyIPBtn) {
        copyIPBtn.style.display = "inline-flex";
        copyIPBtn.addEventListener("click", e => copyToClipboard(ip, e.currentTarget));
      }
    } else {
      if (ipEl) ipEl.textContent = "Could not resolve";
      if (copyIPBtn) copyIPBtn.style.display = "none";
    }
  });

  // 6. Bind recon tool buttons
  const links = buildReconLinks(parsed.hostname, parsed.rootDomain);

  const btnMap = {
    "btn-shodan": links.shodan,
    "btn-wayback": links.wayback,
    "btn-whois": links.whois,
    "btn-crtsh": links.crtsh,
    "btn-securitytrails": links.securitytrails,
    "btn-urlscan": links.urlscan,
  };

  Object.entries(btnMap).forEach(([id, url]) => {
    document.getElementById(id)?.addEventListener("click", () => openTab(url));
  });

  // 7. Get JS files via content script
  try {
    chrome.tabs.sendMessage(tab.id, { action: "getJSFiles" }, response => {
      if (chrome.runtime.lastError) {
        // Content script not ready — try scripting.executeScript as fallback
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: () => {
              return [...new Set(
                Array.from(document.querySelectorAll("script[src]"))
                  .map(s => s.src)
                  .filter(src => src.startsWith("http"))
              )];
            },
          },
          results => {
            const files = results?.[0]?.result || [];
            renderJSFiles(files);
          }
        );
        return;
      }
      renderJSFiles(response?.jsFiles || []);
    });
  } catch (err) {
    renderJSFiles([]);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
