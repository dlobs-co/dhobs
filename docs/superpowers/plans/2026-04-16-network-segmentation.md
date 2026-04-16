# Network Segmentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten Docker network membership so `frontend` = Traefik + Dashboard + Tailscale only; all user-facing services move to `backend` only.

**Architecture:** Single file change (`docker-compose.yml`) — remove `frontend` from 9 services, add `backend` to 2 that were frontend-only. No port changes, no code changes.

**Tech Stack:** Docker Compose YAML only.

---

## File Map

| File | Action |
|------|--------|
| `docker-compose.yml` | Modify — network membership for 9 services |
| `Project_S_Logs/57_Network_Segmentation.md` | Create — implementation log |
| `Project_S_Logs/00_Master_Implementation_Plan.md` | Modify — add #242 to v1.0.1 table |

---

## Task 1: Apply network membership changes

**Files:**
- Modify: `docker-compose.yml`

Changes (9 services):

| Service | From | To |
|---------|------|----|
| jellyfin | frontend, backend | backend |
| collabora | frontend, backend | backend |
| theia | frontend, backend | backend |
| synapse | frontend, backend, database | backend, database |
| element | frontend | backend |
| open-webui | frontend, backend | backend |
| kiwix-manager | frontend | backend |
| openvpn-ui | frontend, backend | backend |
| homeforge-backup | frontend, backend, database | backend, database |

- [ ] **Step 1: Apply all 9 network changes to docker-compose.yml**

Edit each service's `networks:` block as per the table above.

- [ ] **Step 2: Verify frontend has only 3 services**

```bash
grep -B30 'networks:' docker-compose.yml | grep -E '(container_name|^\s+- frontend)'
```

Expected: only `project-s-traefik`, `project-s-dashboard`, `project-s-tailscale` reference `- frontend`.

- [ ] **Step 3: Validate compose config parses**

```bash
docker compose config --quiet
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: tighten network segmentation — frontend = Traefik+Dashboard+Tailscale only (#242)"
```

---

## Task 2: Add Log 57 + update roadmap

**Files:**
- Create: `Project_S_Logs/57_Network_Segmentation.md`
- Modify: `Project_S_Logs/00_Master_Implementation_Plan.md`

- [ ] **Step 1: Create Log 57**

- [ ] **Step 2: Update roadmap v1.0.1 table**

Add row: `| Network Segmentation | ⏳ PR Open | #242 | feat/network-segmentation-242 | #57 |`

- [ ] **Step 3: Commit**

```bash
git add Project_S_Logs/57_Network_Segmentation.md \
  Project_S_Logs/00_Master_Implementation_Plan.md
git commit -m "docs: add Log 57 and update roadmap for network segmentation (#242)"
```

---

## Task 3: Push + open PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/network-segmentation-242
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "feat: network segmentation — frontend = Traefik+Dashboard+Tailscale only (#242)" \
  --body "..."
```
