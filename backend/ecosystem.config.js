module.exports = {
  apps: [
    {
      name: 'api-production',
      script: 'dist/index.js',
      env: { NODE_ENV: 'production' },
      instances: 'max',
      exec_mode: 'cluster',
    },
    {
      name: 'api-staging',
      script: 'dist/index.js',
      env: { NODE_ENV: 'staging' },
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
