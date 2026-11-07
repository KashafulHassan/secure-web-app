module.exports = {
  testDir: "./tests/e2e",
  timeout: 30000,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
};