# Project S

A collaborative project building a unified, self-hosted digital hub platform.

## About

This repository contains the implementation plan, product definition, technical feasibility analysis, and documentation for Project S — a self-hosted operating system for the home server that integrates the best open-source tools into a single, easy-to-manage interface.

---

## 1. 🚀 QUICK START (HOW TO STARTUP)

To start the entire Project S ecosystem perfectly with a single command, use the **`boom.sh`** script located in the root directory:

```bash
./boom.sh
```

**What this script does:**
1.  **Clean Up:** Automatically removes any old or conflicting containers to ensure a fresh state.
2.  **Permissions:** Automatically fixes file permission issues (especially for Matrix/Synapse logging).
3.  **Orchestration:** Starts all services (Proxy, Dashboard, Backends, Databases) in the correct order.
4.  **Health Check:** Waits for the Dashboard to be fully ready and responding.
5.  **Auto-Launch:** Automatically opens your default web browser to the dashboard.

---

## 2. 📦 INTEGRATED SERVICES (WHAT IS ADDED)

The following services are currently functional and fully integrated into the Project S Dashboard:

-   **Main Dashboard:** The central hub for all services (Port `:3069`).
-   **Jellyfin:** Media & Entertainment server.
-   **Nextcloud:** Cloud productivity and file management.
-   **Matrix (Element):** Secure, encrypted communication suite.
-   **Vaultwarden:** Enterprise-grade password management.
-   **Theia CodeSpace:** Integrated development environment (Port `:3030`).

---

## 3. 🛠️ ADDING NEW SERVICES (SCALING & EXPANSION)

To add more applications to the ecosystem in the future, follow this 4-step checklist:

1.  **Docker:** Add the service to `docker-compose.yml`. (No need to expose host ports).
2.  **Gateway:** Add a proxied location in `config/nginx/nginx.conf` to handle security headers.
3.  **Launcher:** Add the app to the `applications` array in `welcome-section.tsx`.
4.  **Windowing:** Define the window component in `app/page.tsx` so it opens as a draggable app.

*Note: `boom.sh` will automatically detect and start any new services added to the compose file.*

---

## 4. 📝 PROJECT DOCUMENTATION & LOGS

Stay up to date with the development progress through our detailed logging system:

-   **Technical Logs:** All research and implementation records are located in the **`Project_S_Logs/`** directory.
-   **Static UI Preview:** For a quick look at the interface without running Docker, open the **`Project_S_Logs/06_Dashboard_Technical_Report.html`** file in any browser. This is a functional, high-fidelity mirror of the dashboard frontend.

---

## Contributors

- [BasilSuhail](https://github.com/BasilSuhail)
- [saadsh15](https://github.com/saadsh15)
