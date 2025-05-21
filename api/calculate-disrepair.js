// api/calculate-disrepair.js
const { validateApiKey } = require('../middleware');
const { rateLimit } = require('../rate-limiter');
const { calculateDisrepairOverlap } = require('../calculator');

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
 * Main handler for the calculate-disrepair API endpoint
 * Processes disrepair periods and calculates overlapping time periods
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-FuturByte-Frontend');

  // Handle OPTIONS request (pre-flight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowedMethods: ['POST', 'OPTIONS']
    });
  }
  
  try {
    // Apply rate limiting first
    console.log('Applying rate limiting...');
    await applyMiddleware(req, res, rateLimit);

    // Apply authentication middleware
    console.log('Applying authentication...');
    await applyMiddleware(req, res, validateApiKey);
    
    // If we get here, authentication was successful
    console.log(`API request from: ${req.client?.name || 'Unknown client'}`);
    
    // Get disrepair periods and total rooms from request body
    const { periods, totalRooms, rooms } = req.body;
    
    // Validate input
    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({
        error: 'Invalid input - Disrepair periods required'
      });
    }
    
    // Validate each period has the required properties
    for (const period of periods) {
      if (!period.roomName || !period.startDate || !period.endDate) {
        return res.status(400).json({ 
          error: 'Invalid input - Each period must have roomName, startDate, and endDate'
        });
      }
    }
    
    // For totalRooms: if explicitly provided, use it; otherwise calculate from unique rooms
    let effectiveTotalRooms = null;
    
    // If rooms array is provided, use its length
    if (rooms && Array.isArray(rooms)) {
      effectiveTotalRooms = rooms.length;
    } 
    // If totalRooms is provided and valid, use it
    else if (totalRooms && !isNaN(totalRooms) && totalRooms > 0) {
      effectiveTotalRooms = parseInt(totalRooms, 10);
    } 
    // Otherwise, calculate from unique room names in periods
    else {
      const uniqueRooms = new Set();
      periods.forEach(period => {
        if (period.roomName) {
          uniqueRooms.add(period.roomName);
        }
      });
      effectiveTotalRooms = uniqueRooms.size;
    }
    
    // Calculate overlapping periods with the determined totalRooms
    const results = calculateDisrepairOverlap(periods, effectiveTotalRooms);
    
    // Return results
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Server error processing disrepair analysis',
      details: error.message
    });
  }
};