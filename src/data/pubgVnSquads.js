// src/data/pubgVnSquads.js

export const PUBG_VN_SQUADS = [
  {
    id: 'ces',
    name: 'Cerberus Esports',
    map: 'Erangel',
    phase: 'Phase 6',
    alive: 4,
    kills: 14,
    wwcdProb: '68%',
    status: 'In Safe Zone',
  },
  {
    id: 'te',
    name: 'The Expendables',
    map: 'Miramar',
    phase: 'Phase 7',
    alive: 4,
    kills: 18,
    wwcdProb: '82%',
    status: 'Holding High Ground',
  },
  {
    id: 'ge',
    name: 'Genius Esports',
    map: 'Taego',
    phase: 'Phase 5',
    alive: 3,
    kills: 9,
    wwcdProb: '41%',
    status: 'Rotating Blue Zone',
  },
];

export async function fetchKraftonPubgTelemetry(squadId, { signal } = {}) {
  const squad = PUBG_VN_SQUADS.find((item) => item.id === squadId);

  if (!squad) {
    throw new Error(`Unknown squad: ${squadId}`);
  }

  // Abort the mock request immediately when the signal is triggered.
  await new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timerId = setTimeout(resolve, 800);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timerId);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    }
  });

  // Check again in case cancellation occurred before telemetry processing.
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Simulate 35% packet loss to reproduce unreliable telemetry networks.
  const isLoss = Math.random() < 0.35;

  if (isLoss) {
    throw new Error('Blue-Zone satellite packet lost (35% simulated)');
  }

  // Return an independent copy so callers cannot mutate the source dataset.
  return {
    ...structuredClone(squad),
    fetchedAt: Date.now(),
  };
}
