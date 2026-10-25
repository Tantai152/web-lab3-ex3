import { useEffect, useState } from 'react';
import {
  PUBG_VN_SQUADS,
  fetchKraftonPubgTelemetry,
} from '../data/pubgVnSquads.js';
import styles from './PubgMatchTelemetry.module.css';

export function PubgMatchTelemetry({ defaultSquadId = 'te' }) {
  const [squadId, setSquadId] = useState(defaultSquadId);
  const [retryTick, setRetryTick] = useState(0);
  const [view, setView] = useState({
    status: 'IDLE',
    data: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    setView({ status: 'LOADING', data: null, error: null });

    fetchKraftonPubgTelemetry(squadId, {
      signal: controller.signal,
    })
      .then((payload) => {
        setView({
          status: 'SUCCESS',
          data: payload,
          error: null,
        });
      })
      .catch((err) => {
        // Abort prevents stale requests from updating the current view.
        if (err.name === 'AbortError') return;

        setView({
          status: 'ERROR',
          data: null,
          error: err.message,
        });
      });

    return () => controller.abort();
  }, [squadId, retryTick]);

  if (view.status === 'LOADING' || view.status === 'IDLE') {
    return (
      <section aria-busy="true" className={styles.skeleton}>
        <p>Syncing KRAFTON Radar...</p>
      </section>
    );
  }

  if (view.status === 'ERROR') {
    return (
      <section role="alert" className={styles.errorAlert}>
        <p>Blue-Zone Link Lost: {view.error}</p>
        <button
          type="button"
          onClick={() => setRetryTick((t) => t + 1)}
        >
          Reconnect Satellite
        </button>
      </section>
    );
  }

  return (
    <section className={styles.container} aria-live="polite">
      <header>
        <h2>KRAFTON PUBG VN Telemetry</h2>
        <p>Live radar for Vietnamese PVS squads</p>
      </header>

      <nav aria-label="Squad selector">
        {PUBG_VN_SQUADS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSquadId(s.id)}
            aria-pressed={s.id === squadId}
          >
            {s.name}
          </button>
        ))}
      </nav>

      {view.data && (
        <article className={styles.telemetryCard}>
          <h3>{view.data.name}</h3>
          <dl>
            <dt>Map</dt>
            <dd>{view.data.map}</dd>

            <dt>Phase</dt>
            <dd>{view.data.phase}</dd>

            <dt>Alive</dt>
            <dd>{view.data.alive}</dd>

            <dt>Kills</dt>
            <dd>{view.data.kills}</dd>

            <dt>WWCD Prob</dt>
            <dd>{view.data.wwcdProb}</dd>

            <dt>Status</dt>
            <dd>{view.data.status}</dd>
          </dl>
        </article>
      )}
    </section>
  );
}
