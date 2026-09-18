import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app.js';
import { startHospitalNodes } from './server/mockHospitals.js';

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // In local development, start the 3 background mock hospital microservices on ports 4001, 4002, 4003
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    startHospitalNodes();
  }

  // Vite Middleware Setup for Local Development vs Static Production Serving
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start listening only when executed directly (not when imported as a serverless module)
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[PulseKey Core] Broker & UI running on http://0.0.0.0:${PORT}`);
    });
  }
}

// Auto start if executed as main
startServer().catch((err) => {
  console.error('[PulseKey Startup Error]:', err);
});

export default app;
