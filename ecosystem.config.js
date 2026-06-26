module.exports = {
  apps: [
    {
      name: 'node-backend',
      script: './index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
