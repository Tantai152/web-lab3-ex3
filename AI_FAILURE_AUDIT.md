# AI FAILURE MODE AUDIT — KRAFTON PUBG VN Telemetry

## Overview
Audit of common errors when AI prompts generate React 19 telemetry code. Each vulnerability includes actual buggy AI code, proof from DevTools, and the refactored code in the repo.

---

## Vulnerability 01: Stale Closure in Auto-Polling (Race Condition)

**AI Prompt used:**
"Add 3-second auto-refresh to PubgMatchTelemetry"

**AI Generated Code (Error):**
```javascript
useEffect(() => {
  const id = setInterval(() => {
    fetchKraftonPubgTelemetry(squadId, {}).then(setView);
  }, 3000);
  return () => clearInterval(id);
}, []); // ⚠️ Empty deps — squadId frozen
```
**Risk:**
CWE-362 (Race Condition). `squadId` is frozen at its initial value ('te') forever. When the user switches to CES, the interval keeps fetching TE → UI displays wrong squad data. Additionally, the fetch has no `AbortSignal`, so a slow stale response can overwrite a newer response (stale response attack).

**Detection Method:**
- Network tab, filter XHR.
- Switch squad TE → CES → TE.
- After 3s, observe request still calls squadId=te (not ces).
- DevTools Console: Warning: Can't perform a React state update on an unmounted component when switching quickly.

**Engineering Refactor:**
```javascript
useEffect(() => {
  const controller = new AbortController();
  const id = setInterval(() => {
    fetchKraftonPubgTelemetry(squadId, { signal: controller.signal })
      .then((data) => setView({ status: 'SUCCESS', data, error: null }))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setView({ status: 'ERROR', data: null, error: err.message });
      });
  }, 3000);
  return () => {
    clearInterval(id);
    controller.abort();
  };
}, [squadId]); // ✅ squadId in deps
```
**Verification:**
- Network tab: when switching squad, old request shows (canceled), new request uses correct squadId. No more unmounted warning.

---

## Vulnerability 02: Missing AbortController Cleanup (Memory Leak)

**AI Prompt used:**
"Fetch telemetry on mount and display loading skeleton"

**AI Generated Code (Error):**
```javascript
useEffect(() => {
  setView({ status: 'LOADING' });
  fetchKraftonPubgTelemetry(squadId).then((data) => {
    setView({ status: 'SUCCESS', data });
  });
  // ⚠️ No return cleanup — fetch keeps running after unmount
}, [squadId]);
```
**Risk:**
CWE-401 (Memory Leak) + CWE-362 (Race Condition). When the user leaves the page or StrictMode double-invokes, the old fetch still resolves → calls `setView` on an unmounted component → React warning, memory retains reference to the old component, and a stale response can overwrite state of the new mount.

**Detection Method:**
- React DevTools → Profiler → enable "Record why each component rendered".
- Unmount component (switch route / clear).
- Console shows Warning: Can't perform a React state update on an unmounted component.
- Network tab: request remains (pending) after unmount.

**Engineering Refactor:**
```javascript
useEffect(() => {
  const controller = new AbortController();
  setView({ status: 'LOADING', data: null, error: null });
  fetchKraftonPubgTelemetry(squadId, { signal: controller.signal })
    .then((data) => setView({ status: 'SUCCESS', data, error: null }))
    .catch((err) => {
      if (err.name === 'AbortError') return;
      setView({ status: 'ERROR', data: null, error: err.message });
    });
  return () => controller.abort(); // ✅ cleanup
}, [squadId, retryTick]);
```
**Verification:**
- StrictMode mount → unmount → mount: console no longer shows warning, Network tab shows old request (canceled).

---

## Vulnerability 03: Naive setInterval Countdown Drift

**AI Prompt used:**
"Add a 10-second airdrop countdown timer to the telemetry widget"

**AI Generated Code (Error):**
```javascript
const [seconds, setSeconds] = useState(10);
useEffect(() => {
  const id = setInterval(() => setSeconds((s) => s - 1), 1000);
  return () => clearInterval(id);
}, []);
// Render: <p>Next airdrop: {seconds}s</p>
```
**Risk:**
CWE-400 (Uncontrolled Resource Consumption) + clock drift. Chrome throttles background tabs → 1 tick per minute. If the user switches tabs for 2 minutes, the countdown is wrong (shows 8s remaining instead of already 0). Additionally, if AI suggests `innerHTML` to render the countdown, XSS is possible if `seconds` is injected from server.

**Detection Method:**
- Run countdown, switch to another tab for 30s.
- Return to tab: countdown shows ~7-8s instead of ~ -20s (already expired).
- DevTools Performance: interval ticks are sparse when tab is in background.

**Engineering Refactor:**
```javascript
export function useAirdropCountdown(targetEpochMs) {
  const [remainingMs, setRemainingMs] = useState(
    () => Math.max(0, targetEpochMs - Date.now())
  );
  useEffect(() => {
    const sync = () =>
      setRemainingMs(Math.max(0, targetEpochMs - Date.now()));
    sync();
    const id = setInterval(sync, 200); // recompute from Date.now()
    const onWake = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onWake);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [targetEpochMs]);
  return { remainingMs, isLive: remainingMs === 0 };
}
```
**Verification:**
- Switch tab for 30s → return, countdown jumps correctly (recomputed from Date.now()). No drift. No `innerHTML` used for rendering.

---

## Summary Table

| # | Vulnerability | CWE | Severity | Fixed |
|---|---|---|---|---|
| 01 | Stale closure auto-polling | CWE-362 | High | Yes |
| 02 | Missing AbortController cleanup | CWE-401 + CWE-362 | Critical | Yes |
| 03 | Naive setInterval drift | CWE-400 | Medium | Yes |

### Repo Evidence
- File `src/data/pubgVnSquads.js` lines 36-88: abortable mock fetch with `{ signal }`.
- File `src/components/PubgMatchTelemetry.jsx` lines 17-42: `useEffect` with AbortController + cleanup `controller.abort()`.
- File `src/components/PubgMatchTelemetry.jsx` lines 33-34: `if (err.name === 'AbortError') return;` guard.