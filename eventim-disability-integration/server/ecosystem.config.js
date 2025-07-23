// ecosystem.config.js im Projekt-Root
module.exports = {
  apps: [{
    name: 'eventim-backend',
    cwd: './server',        // <-- hier
    script: 'server.js',    // liegt jetzt unter ./server/server.js
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    restart_delay: 5000,
    env: {
      NODE_ENV: 'production'
    }
  }]
};