// T0 Transport — Tauri IPC primitives

export { invoke, isTauri, isTauriReady, awaitTauriReady } from './invoke';
export { createEventBus, type EventBus } from './events';
export { TransportError, TransportErrorCode } from './error';
export { createConnectionTracker, type ConnectionState } from './connection';

// New from NNJAS port - Connection quality monitoring
export {
  startQualityMonitoring,
  stopQualityMonitoring,
  recordPingStart,
  recordPingEnd,
  subscribeQuality,
  getCurrentMetrics,
  createQualityMonitor,
  getQualityColor,
  getQualityLabel,
  type QualityMetrics,
  type QualitySample,
  type QualityLevel,
  type QualityMonitor,
} from './quality';
