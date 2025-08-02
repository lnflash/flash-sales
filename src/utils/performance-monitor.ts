// Performance monitoring utilities for Flash Sales Dashboard

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  // Measure component render time
  measureRender(componentName: string, callback: () => void) {
    const start = performance.now();
    callback();
    const duration = performance.now() - start;
    
    this.recordMetric({
      name: `render_${componentName}`,
      value: duration,
      timestamp: Date.now(),
      metadata: { component: componentName }
    });

    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && duration > 16.67) {
      console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  }

  // Measure API call performance
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `api_${name}`,
        value: duration,
        timestamp: Date.now(),
        metadata: { api: name, success: true }
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `api_${name}`,
        value: duration,
        timestamp: Date.now(),
        metadata: { api: name, success: false, error: error instanceof Error ? error.message : String(error) }
      });

      throw error;
    }
  }

  // Monitor Core Web Vitals
  initWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordMetric({
        name: 'web_vital_lcp',
        value: lastEntry.startTime,
        timestamp: Date.now(),
        metadata: { element: (lastEntry as any).element?.tagName }
      });
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', lcpObserver);

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.recordMetric({
          name: 'web_vital_fid',
          value: entry.processingStart - entry.startTime,
          timestamp: Date.now(),
          metadata: { eventType: entry.name }
        });
      });
    });

    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', fidObserver);

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.recordMetric({
            name: 'web_vital_cls',
            value: clsValue,
            timestamp: Date.now(),
            metadata: { sources: entry.sources?.length || 0 }
          });
        }
      });
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', clsObserver);
  }

  // Monitor memory usage
  monitorMemory() {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      this.recordMetric({
        name: 'memory_usage',
        value: memory.usedJSHeapSize,
        timestamp: Date.now(),
        metadata: {
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      });

      // Warn on high memory usage
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      if (usage > 0.9) {
        console.warn(`High memory usage detected: ${(usage * 100).toFixed(1)}%`);
      }
    }, 30000); // Check every 30 seconds
  }

  // Record a metric
  public recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  // Send metrics to analytics service
  private async sendToAnalytics(metric: PerformanceMetric) {
    // TODO: Implement sending to your analytics service
    // For now, just log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', metric);
    }
  }

  // Get performance summary
  getSummary() {
    const summary: Record<string, any> = {};

    // Group metrics by name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics
    Object.entries(grouped).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b);
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    });

    return summary;
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    performanceMonitor.measureRender(componentName, () => {
      // Measure render time
    });

    // Log excessive re-renders in development
    if (process.env.NODE_ENV === 'development' && renderCount.current > 10) {
      console.warn(`Component ${componentName} has rendered ${renderCount.current} times`);
    }
  });

  return {
    measureAction: (actionName: string, action: () => void) => {
      const start = performance.now();
      action();
      const duration = performance.now() - start;
      
      performanceMonitor.recordMetric({
        name: `action_${componentName}_${actionName}`,
        value: duration,
        timestamp: Date.now(),
        metadata: { component: componentName, action: actionName }
      });
    }
  };
}