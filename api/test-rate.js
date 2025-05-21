// api/test-rate.js
const { rateLimit } = require('../rate-limiter');

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

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-FuturByte-Frontend');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Apply rate limiting only
    await applyMiddleware(req, res, rateLimit);
    
    // Return success with rate limit info
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