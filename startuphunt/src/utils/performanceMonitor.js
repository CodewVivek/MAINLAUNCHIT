/**
 * Performance Monitoring Utility
 * Tracks performance improvements from optimizations
 */

// Performance metrics storage
const performanceMetrics = {
  imageOptimizations: 0,
  totalImageSizeSaved: 0,
  subscriptionFixes: false,
  lastOptimization: null
};

/**
 * Track image optimization
 * @param {number} originalSize - Original file size in bytes
 * @param {number} optimizedSize - Optimized file size in bytes
 */
export const trackImageOptimization = (originalSize, optimizedSize) => {
  const saved = originalSize - optimizedSize;
  performanceMetrics.imageOptimizations++;
  performanceMetrics.totalImageSizeSaved += saved;
  performanceMetrics.lastOptimization = new Date().toISOString();
  
  // Performance tracking (silent in production)
};

/**
 * Mark subscription fixes as applied
 */
export const markSubscriptionFixesApplied = () => {
  performanceMetrics.subscriptionFixes = true;
  // Performance tracking (silent in production)
};

/**
 * Get performance summary
 * @returns {object} Performance metrics summary
 */
export const getPerformanceSummary = () => {
  return {
    ...performanceMetrics,
    totalImageSizeSavedFormatted: formatBytes(performanceMetrics.totalImageSizeSaved),
    estimatedPerformanceScore: estimatePerformanceScore()
  };
};

/**
 * Estimate performance score improvement
 * @returns {string} Estimated performance score
 */
const estimatePerformanceScore = () => {
  let baseScore = 72; // Current desktop score
  
  if (performanceMetrics.subscriptionFixes) {
    baseScore += 5; // Subscription fixes improvement
  }
  
  if (performanceMetrics.totalImageSizeSaved > 10 * 1024 * 1024) { // 10MB+
    baseScore += 15; // Major image optimization
  } else if (performanceMetrics.totalImageSizeSaved > 5 * 1024 * 1024) { // 5MB+
    baseScore += 10; // Moderate image optimization
  } else if (performanceMetrics.totalImageSizeSaved > 1 * 1024 * 1024) { // 1MB+
    baseScore += 5; // Minor image optimization
  }
  
  return `${baseScore}/100`;
};

/**
 * Format bytes to human readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted size
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Log performance improvements for PageSpeed Insights
 */
export const logPageSpeedImprovements = () => {
  // Performance logging (silent in production)
  // Uncomment for development debugging if needed
}; 