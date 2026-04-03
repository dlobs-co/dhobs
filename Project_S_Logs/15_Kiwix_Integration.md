# Project S — Kiwix Architecture & Workflow Log

> [!IMPORTANT]
> **ARCHITECTURAL NOTICE: THE KIWIX FRONTEND SHELL**
> The intended and ONLY supported way to access Kiwix in Project S is via the dedicated Next.js app page at **`http://localhost:3069/kiwix`**. 
> 
> **Do NOT access the raw service port (`localhost:8087`) directly.** 
> The raw `kiwix-serve` engine automatically registers a Kiwix JS PWA ServiceWorker. If accessed directly in a browser, this ServiceWorker aggressively caches and hijacks future requests, breaking the dashboard integration and causing blank screens. The `/kiwix` Next.js page acts as a protective "shell," wrapping the raw services in controlled iframes to provide a seamless, native-feeling app experience without PWA interference.

This document details the complete lifecycle and operational workflow of the **Kiwix** offline knowledge base within the Project S environment. 

---

## 1. Directory Initialization

The system utilizes persistent local storage for ZIM files:

```bash
mkdir -p ./data/kiwix
```

**Purpose:**
This creates a persistent local directory (`./data/kiwix`) on the host machine. This directory serves as the centralized storage location where both the backend reader and the upload manager interact with `.zim` files.

---

## 2. Docker Deployment (`docker-compose.yml`)

The Kiwix ecosystem in Project S requires two separate Docker services working in tandem, mounted to the same data volume:

### A. The Reader (`kiwix-serve`)
```yaml
  kiwix:
    image: ghcr.io/kiwix/kiwix-serve:3.7.0
    container_name: project-s-kiwix-reader
    ports:
      - '8087:8080'
    volumes:
      - ./data/kiwix:/data
    entrypoint: ["sh", "-c"]
    command: >
      "rm -f /data/library.xml &&
      if ls /data/*.zim >/dev/null 2>&1; then
        kiwix-manage /data/library.xml add /data/*.zim &&
        kiwix-serve --port=8080 --library /data/library.xml;
      else
        echo 'No ZIM files found.' && sleep infinity;
      fi"
```
* **Port:** 8087 (Internal raw reader).
* **Logic:** Automatically rebuilds the `library.xml` cache on startup to ensure new files are recognized, then serves the content.

### B. The Manager (`filebrowser`)
```yaml
  kiwix-manager:
    image: filebrowser/filebrowser:v2.31.2
    container_name: project-s-kiwix-manager
    ports:
      - '8086:80'
    volumes:
      - ./data/kiwix:/srv
    command: ["--noauth", "--database", "/database.db", "--root", "/srv"]
```
* **Port:** 8086 (Internal upload manager).
* **Logic:** Provides a lightweight, web-based file manager allowing the user to upload/delete `.zim` files directly from the UI without needing SSH/SFTP access. Authentication is bypassed (`--noauth`) because the dashboard handles access control.

---

## 3. The App Interface (`/kiwix`)

Instead of embedding Kiwix inside a small dashboard widget, Project S treats Kiwix as a first-class, standalone application encapsulated within the Next.js framework.

### The Shell (`app/kiwix/page.tsx` & `kiwix-section.tsx`)
When the user clicks the "Kiwix (Embedded)" card on the main dashboard, they are navigated to `/kiwix`. This page:
1. Prevents cross-origin/PWA caching issues.
2. Provides a customized Top Bar with a "Back to Dashboard" button.
3. Offers a tabbed interface:
   - **Browse Tab:** Iframes `http://localhost:8087` (The Kiwix Reader).
   - **Manage Tab:** Iframes `http://localhost:8086` (The Filebrowser Manager).

This dual-iframe approach creates the illusion of a single, unified "Kiwix App" that handles both reading and file management seamlessly.

---

## 4. Health Monitoring (`health.sh`)

The system's health script actively monitors the internal port:

```bash
check_service "Kiwix" "http://localhost:8087"
```

---

## Summary of the User Journey

1. **Access:** User opens Dashboard and clicks "Kiwix". They are routed to `localhost:3069/kiwix`.
2. **Upload:** User clicks the **Manage** tab (Filebrowser) and drags-and-drops a `.zim` file into the UI.
3. **Refresh:** User clicks the **Refresh Library** button in the top right. This triggers a backend API route (`/api/docker/restart?container=project-s-kiwix-reader`), which restarts the reader. The reader rebuilds `library.xml` on boot.
4. **Browse:** User swaps back to the **Browse** tab and the new `.zim` file is actively loaded and ready to read.