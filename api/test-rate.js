// api/test-rate.js
const { rateLimit } = require('../rate-limiter');

/**
 * Adapter function to use middleware with Vercel serverless functions
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} middleware - Express middleware function to adapt
 * @returns {Promise} Resolves when middleware completes
 */
function applyMiddleware(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

/**
 * Test-rate endpoint handler
 * Provides information about current rate limiting status
 * Useful for testing and debugging rate limiting
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Lexiotech-Frontend');
  
  // Handle OPTIONS request (pre-flight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Apply rate limiting only (no authentication check)
    await applyMiddleware(req, res, rateLimit);
    
    // Return success with rate limit information from response headers
    return res.status(200).json({
      message: 'Rate limit test passed',
      rateLimit: {
        limit: res.getHeader('X-RateLimit-Limit'),
        remaining: res.getHeader('X-RateLimit-Remaining'),
        reset: res.getHeader('X-RateLimit-Reset')
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing rate limit:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
};