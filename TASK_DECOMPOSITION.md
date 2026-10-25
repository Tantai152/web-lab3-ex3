# WBS - Lab 3 Exercise 3: KRAFTON PUBG VN Live Telemetry

**Objective:** Live telemetry radar cho PVS Vietnamese squads với 4-state machine (IDLE | LOADING | SUCCESS | ERROR), AbortController cancellation, và 220px Skeleton UI. Zero `window.alert()`.

## Task Breakdown

| Task ID | Description | Commit Message | File(s) |
|---|---|---|---|
| EX3-00 | Init rules & WBS | `chore(ex3): init project rules and WBS` | `project-rules.md`, `TASK_DECOMPOSITION.md` |
| EX3-01 | Scaffold Vite React 19 | `chore(ex3): scaffold vite react 19 project` | `package.json`, `vite.config.js`, `src/main.jsx` |
| EX3-02 | Dataset + abortable mock fetch (35% packet loss) | `feat(ex3): add pubg vn squads dataset and abortable mock fetch` | `src/data/pubgVnSquads.js` |
| EX3-03 | PubgMatchTelemetry 4-state machine + AbortController | `feat(ex3): implement pubg vn 4-state telemetry & abortcontroller` | `src/components/PubgMatchTelemetry.jsx` |
| EX3-04 | Skeleton UI + Retry alert CSS | `style(ex3): add skeleton ui & retry alert styles` | `src/components/PubgMatchTelemetry.module.css` |
| EX3-05 | Mount in App | `feat(ex3): mount pubg telemetry in app` | `src/App.jsx` |
| EX3-06 | AI Failure Audit (3 bugs) | `docs(audit): add ai failure mode audit report` | `AI_FAILURE_AUDIT.md` |

## Flow

```mermaid
flowchart LR
    T1["1️⃣ Dataset &<br/>Mock Fetch"] --> T2["2️⃣ Telemetry<br/>FSM"] --> T3["3️⃣ Skeleton<br/>CSS"] --> T4["4️⃣ Mount<br/>App"] --> T5["5️⃣ AI<br/>Audit"]

    style T1 fill:#e3f2fd,stroke:#1976d2
    style T2 fill:#fff3e0,stroke:#f57c00
    style T3 fill:#f3e5f5,stroke:#7b1fa2
    style T4 fill:#e8f5e9,stroke:#388e3c
    style T5 fill:#ffebee,stroke:#c62828
Anti-Patterns Banned (per project-rules.md)
❌ window.alert() → dùng <section role="alert">.

❌ Race condition: setView() sau khi unmount hoặc switch squad → dùng AbortController.

❌ Catch AbortError và hiển thị ERROR banner → guard if (err.name === 'AbortError') return;.

❌ useEffect không trả cleanup → memory leak.

❌ <div> soup → semantic tags.

❌ Boolean soup isLoading && !isError && !data → dùng status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'.

❌ Inline style, hex code ngoài :root.

Acceptance Criteria
□ 4 states: IDLE, LOADING, SUCCESS, ERROR (union type / object state, không dùng boolean soup).
□ Chuyển squad nhanh (CES → TE → GE) không flash error banner.
□ DevTools Network: request cũ hiện (canceled) khi switch squad.
□ Skeleton 220px có aria-busy="true" trong lúc LOADING.
□ Nút "Reconnect Satellite" increment retryTick → refetch.
□ Error hiển thị trong <section role="alert">, không window.alert().
□ Zero innerHTML, zero var, zero import * as React.
□ AI_FAILURE_AUDIT.md có ≥3 lỗi (stale closure, missing AbortController, setInterval drift).
Dataset (Vietnamese PVS squads)
id	name	map	phase	alive	kills	wwcdProb	status
ces	Cerberus Esports	Erangel	Phase 6	4	14	68%	In Safe Zone
te	The Expendables	Miramar	Phase 7	4	18	82%	Holding High Ground
ge	Genius Esports	Taego	Phase 5	3	9	41%	Rotating Blue Zone
