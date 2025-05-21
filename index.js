// index.js
/**
 * Main entry point for the application
 * Redirects to the main HTML page
 */
module.exports = (req, res) => {
  // Set appropriate header for text/html
  res.setHeader('Content-Type', 'text/html');
  
  // Use 302 redirect to the index.html page
  res.statusCode = 302;
  res.setHeader('Location', '/index.html');
  res.end();
};