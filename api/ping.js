// api/ping.js
const { validateApiKey } = require('../middleware');
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
 * Ping endpoint handler
 * Simple endpoint to check if the API is available and authentication works
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Lexiotech-Frontend');
  
  // Handle OPTIONS requests (pre-flight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Apply rate limiting first
    console.log('Applying rate limiting...');
    await applyMiddleware(req, res, rateLimit);

    // Apply authentication middleware
    console.log('Applying authentication...');
    await applyMiddleware(req, res, validateApiKey);
    
    // If we get here, authentication was successful
    // Return a simple response with client information
    return res.status(200).json({
      status: 'ok',
      message: 'API is running',
      clientName: req.client?.name || 'Unknown client',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing ping request:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
};