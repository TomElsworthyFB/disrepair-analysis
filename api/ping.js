// api/ping.js
const { validateApiKey } = require('../middleware');

// Adapter function to use middleware with Vercel serverless functions
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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Apply authentication middleware
    await applyMiddleware(req, res, validateApiKey);
    
    // If we get here, authentication was successful
    // Return a simple response
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