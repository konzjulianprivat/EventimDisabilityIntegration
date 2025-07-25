module.exports = {
  apps: [{
    name: 'disability-server',
    script: './server/server.js',
    instances: 'max',
    exec_mode: 'cluster'
  }]
};
