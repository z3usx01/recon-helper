# Recon Helper

Recon Helper is a lightweight browser extension designed for quick, passive reconnaissance directly from your browser. It extracts essential target information, resolves IP addresses, lists JavaScript files, and provides instant access to commonly used recon tools.

---

## Features

### Target Information Extraction

* Full URL
* Protocol (HTTP/HTTPS) with TLS status indicator
* Hostname
* Root domain
* Subdomain

### IP Resolution

* Resolves target hostname to IP using Google DNS-over-HTTPS
* Non-blocking, asynchronous resolution

### JavaScript File Discovery

* Extracts all external JavaScript files from the page
* Deduplicated results
* Direct links to each file
* One-click copy functionality

### Recon Tool Shortcuts

Quick access to:

* Shodan
* Wayback Machine
* WHOIS lookup
* crt.sh (certificate transparency)
* SecurityTrails
* URLScan

### Clipboard Support

* Copy URL, domain, and IP address
* Copy individual JavaScript file URLs

### Error Handling

* Handles restricted pages (chrome://, about:, etc.)
* Graceful fallback when content scripts are unavailable
* Safe handling of DNS resolution failures

---

## Installation

1. Download or clone this repository:

   ```
   git clone https://github.com/z3usx01/recon-helper.git
   ```

2. Open your browser:

   * Brave: `brave://extensions`
   * Chrome: `chrome://extensions`

3. Enable **Developer Mode**

4. Click **Load unpacked**

5. Select the project folder

6. The extension icon will appear in your toolbar

---

## Usage

1. Open any HTTP or HTTPS website
2. Click the Recon Helper extension icon
3. View extracted information and use recon shortcuts
4. Copy data or open external tools as needed

---

## Permissions

* `activeTab` — access current tab information
* `scripting` — execute scripts when needed
* `tabs` — manage and open new tabs
* `clipboardWrite` — enable copy functionality
* `host_permissions: <all_urls>` — required for script extraction and recon

---

## Technical Overview

* Manifest Version: 3
* Architecture:

  * Popup-based UI (`popup.html`, `popup.js`)
  * Content script (`content.js`) for DOM extraction
* No background service worker
* Stateless execution (no data storage)

---

## Limitations

* Works only on HTTP/HTTPS pages
* Does not analyze JavaScript content (only lists files)
* DNS resolution depends on external service (Google DoH)
* No persistent storage or session tracking

---

## Disclaimer

This tool is intended for educational and authorized security testing purposes only.

---

