// index.js
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.statusCode = 302; // Redirect
  res.setHeader('Location', '/index.html');
  res.end();
};