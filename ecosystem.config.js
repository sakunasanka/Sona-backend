module.exports = {
  apps: [{
    name: 'sona-backend', // A name for your app
    script: 'dist/app.js', // Your app's entry point
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001 // The port your app listens on
    }
  }]
};
