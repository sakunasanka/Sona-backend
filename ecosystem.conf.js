module.exports = {
  apps: [{
    name: 'sona-backend', // A name for your app
    script: 'app.ts', // Your app's entry point
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001 // The port your app listens on
    }
  }]
};