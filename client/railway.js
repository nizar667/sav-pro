// railway.js à la racine
const { spawn } = require('child_process');

// Démarrer le serveur
const server = spawn('node', ['server/index.ts'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});