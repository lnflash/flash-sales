// Feature flags for the application
export const features = {
  // Real-time features
  realtime: {
    enabled: false, // Temporarily disabled due to 400 errors
    submissions: false,
    presence: false,
    notifications: false,
  },
  
  // AI features
  ai: {
    leadScoring: true,
    recommendations: true,
  },
  
  // Performance features
  performance: {
    virtualScrolling: true,
    lazyLoading: true,
    caching: true,
  }
};

// Helper to check if a feature is enabled
export function isFeatureEnabled(feature: string): boolean {
  const parts = feature.split('.');
  let current: any = features;
  
  for (const part of parts) {
    if (current[part] === undefined) return false;
    current = current[part];
  }
  
  return current === true;
}