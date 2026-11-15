let app;
let loadError = null;

try {
  app = require('../src/app');
} catch (err) {
  loadError = err;
  console.error('[CRITICAL] Failed to load Express app:', err);
}

module.exports = (req, res) => {
  if (loadError) {
    return res.status(500).json({
      success: false,
      error: 'Backend Initialization Failure',
      message: loadError.message,
      stack: loadError.stack,
      diagnostic: {
        nodeVersion: process.version,
        env: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        hasMongoUri: !!process.env.MONGO_URI,
      },
    });
  }

  try {
    return app(req, res);
  } catch (err) {
    console.error('[CRITICAL] Unhandled Invocation Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Backend Invocation Exception',
      message: err.message,
      stack: err.stack,
    });
  }
};
