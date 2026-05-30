/**
 * Connection Quality Monitoring
 * 
 * A generalized version of NNJAS quality.ts for the LEAP design system.
 * Monitors WebSocket/connection quality with latency tracking.
 */

export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

export interface QualitySample {
  timestamp: number;
  latency: number | null;
  lost: boolean;
}

export interface QualityMetrics {
  latency: number | null;
  jitter: number | null;
  lossRate: number;
  quality: QualityLevel;
  history: QualitySample[];
}

export interface QualityMonitor {
  start(): void;
  stop(): void;
  ping(): void;
  getMetrics(): QualityMetrics;
  subscribe(callback: (metrics: QualityMetrics) => void): () => void;
}

const SAMPLE_WINDOW = 60; // 60 seconds of history
const PING_INTERVAL = 5000; // Ping every 5 seconds
const MAX_HISTORY = 12; // Keep last 12 samples

let metrics: QualityMetrics = {
  latency: null,
  jitter: null,
  lossRate: 0,
  quality: 'disconnected',
  history: []
};

let pingId = 0;
let pingStartTime: number | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let subscribers: Set<(metrics: QualityMetrics) => void> = new Set();

function calculateQuality(latency: number | null, lossRate: number): QualityLevel {
  if (latency === null || lossRate > 0.1) return 'disconnected';
  if (latency < 50 && lossRate === 0) return 'excellent';
  if (latency < 150 && lossRate < 0.01) return 'good';
  if (latency < 300 && lossRate < 0.05) return 'fair';
  return 'poor';
}

function calculateJitter(latencies: number[]): number | null {
  if (latencies.length < 2) return null;
  const diffs = [];
  for (let i = 1; i < latencies.length; i++) {
    diffs.push(Math.abs(latencies[i] - latencies[i - 1]));
  }
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

function updateMetrics() {
  const recent = metrics.history.slice(-MAX_HISTORY);
  const validLatencies = recent.filter(s => !s.lost && s.latency !== null).map(s => s.latency!);
  
  const lostCount = recent.filter(s => s.lost).length;
  const lossRate = recent.length > 0 ? lostCount / recent.length : 0;
  
  const avgLatency = validLatencies.length > 0
    ? validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length
    : null;
  
  metrics = {
    latency: avgLatency,
    jitter: calculateJitter(validLatencies),
    lossRate,
    quality: calculateQuality(avgLatency, lossRate),
    history: recent
  };
  
  // Notify subscribers
  subscribers.forEach(cb => cb(metrics));
}

export function getQualityColor(quality: QualityLevel): string {
  switch (quality) {
    case 'excellent': return 'var(--color-success, #27ae60)';
    case 'good': return 'var(--color-success, #27ae60)';
    case 'fair': return 'var(--color-warning, #f39c12)';
    case 'poor': return 'var(--color-error, #c0392b)';
    case 'disconnected': return 'var(--color-text-muted, #666)';
  }
}

export function getQualityLabel(quality: QualityLevel): string {
  switch (quality) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'fair': return 'Fair';
    case 'poor': return 'Poor';
    case 'disconnected': return 'Disconnected';
  }
}

export function startQualityMonitoring(): void {
  if (intervalId) return;
  
  intervalId = setInterval(() => {
    // If no ping response within timeout, mark as lost
    if (pingStartTime !== null) {
      const elapsed = Date.now() - pingStartTime;
      if (elapsed > 3000) {
        metrics.history.push({
          timestamp: Date.now(),
          latency: null,
          lost: true
        });
        pingStartTime = null;
        updateMetrics();
      }
    }
  }, 1000);
}

export function stopQualityMonitoring(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  pingStartTime = null;
}

export function recordPingStart(): number {
  pingStartTime = Date.now();
  return ++pingId;
  }

export function recordPingEnd(id: number, expectedId: number): void {
  if (id !== expectedId) return; // Stale ping
  
  if (pingStartTime !== null) {
    const latency = Date.now() - pingStartTime;
    metrics.history.push({
      timestamp: Date.now(),
      latency,
      lost: false
    });
    pingStartTime = null;
    
    // Trim history
    if (metrics.history.length > MAX_HISTORY) {
      metrics.history = metrics.history.slice(-MAX_HISTORY);
    }
    
    updateMetrics();
  }
}

export function subscribeQuality(callback: (metrics: QualityMetrics) => void): () => void {
  subscribers.add(callback);
  
  // Immediately call with current state
  callback(metrics);
  
  return () => {
    subscribers.delete(callback);
  };
}

export function getCurrentMetrics(): QualityMetrics {
  return { ...metrics, history: [...metrics.history] };
}

/**
 * Create a quality monitor for a specific connection
 */
export function createQualityMonitor(): QualityMonitor {
  let localInterval: ReturnType<typeof setInterval> | null = null;
  let localSubscribers: Set<(metrics: QualityMetrics) => void> = new Set();
  let localMetrics: QualityMetrics = {
    latency: null,
    jitter: null,
    lossRate: 0,
    quality: 'disconnected',
    history: []
  };
  
  function notify() {
    localSubscribers.forEach(cb => cb(localMetrics));
  }
  
  return {
    start() {
      if (localInterval) return;
      
      localInterval = setInterval(() => {
        // Auto-detect stale samples
        const lastSample = localMetrics.history[localMetrics.history.length - 1];
        if (lastSample && !lastSample.lost && Date.now() - lastSample.timestamp > 10000) {
          // No ping for 10 seconds, consider disconnected
          localMetrics.history.push({
            timestamp: Date.now(),
            latency: null,
            lost: true
          });
          
          // Trim and update
          if (localMetrics.history.length > MAX_HISTORY) {
            localMetrics.history = localMetrics.history.slice(-MAX_HISTORY);
          }
          
          const recent = localMetrics.history.slice(-MAX_HISTORY);
          const lostCount = recent.filter(s => s.lost).length;
          localMetrics = {
            ...localMetrics,
            lossRate: recent.length > 0 ? lostCount / recent.length : 0,
            quality: 'disconnected'
          };
          
          notify();
        }
      }, 5000);
    },
    
    stop() {
      if (localInterval) {
        clearInterval(localInterval);
        localInterval = null;
      }
    },
    
    ping() {
      const startTime = Date.now();
      
      // Return a function to call when pong received
      return () => {
        const latency = Date.now() - startTime;
        localMetrics.history.push({
          timestamp: Date.now(),
          latency,
          lost: false
        });
        
        // Trim history
        if (localMetrics.history.length > MAX_HISTORY) {
          localMetrics.history = localMetrics.history.slice(-MAX_HISTORY);
        }
        
        // Recalculate metrics
        const recent = localMetrics.history.slice(-MAX_HISTORY);
        const validLatencies = recent.filter(s => !s.lost && s.latency !== null).map(s => s.latency!);
        const lostCount = recent.filter(s => s.lost).length;
        const lossRate = recent.length > 0 ? lostCount / recent.length : 0;
        
        const avgLatency = validLatencies.length > 0
          ? validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length
          : null;
        
        let jitter = null;
        if (validLatencies.length >= 2) {
          const diffs = [];
          for (let i = 1; i < validLatencies.length; i++) {
            diffs.push(Math.abs(validLatencies[i] - validLatencies[i - 1]));
          }
          jitter = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        }
        
        localMetrics = {
          latency: avgLatency,
          jitter,
          lossRate,
          quality: calculateQuality(avgLatency, lossRate),
          history: localMetrics.history
        };
        
        notify();
      };
    },
    
    getMetrics() {
      return { ...localMetrics, history: [...localMetrics.history] };
    },
    
    subscribe(callback) {
      localSubscribers.add(callback);
      callback(localMetrics);
      
      return () => {
        localSubscribers.delete(callback);
      };
    }
  };
}
