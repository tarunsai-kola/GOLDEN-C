let app;
let loadError = null;

try {
  app = require('../server/src/app');
} catch (err) {
  loadError = err;
  console.error('[CRITICAL] Failed to load Express app from root api:', err);
}

module.exports = (req, res) => {
  if (loadError) {
    return res.status(500).json({
      success: false,
      error: 'Backend Initialization Failure (Root API)',
      message: loadError.message,
      stack: loadError.stack,
      diagnostic: {
        note: 'If you deployed from root, please set Root Directory to server in Vercel project settings.',
        nodeVersion: process.version,
        env: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
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
