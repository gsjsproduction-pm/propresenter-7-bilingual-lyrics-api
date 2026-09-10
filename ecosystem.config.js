const path = require("path");
const cwdPath = "/home/ubuntu/propresenter-bilingual-lyrics-api/current";

// Load the environment variables
const result = require("dotenv").config({ path: path.join(cwdPath, ".env") });

// Debug check in terminal
if (result.error) {
  console.error("❌ PM2 Config Error: Could not load .env file!", result.error);
} else {
  console.log("✅ PM2 Config Success: Loaded .env file successfully.");
}

module.exports = {
  apps: [
    {
      name: "propresenter-bilingual-api",
      script: "./dist/index.js",
      cwd: cwdPath,
      instances: 1,
      exec_mode: "fork",
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
