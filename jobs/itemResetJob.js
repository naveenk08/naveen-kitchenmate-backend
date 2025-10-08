const cron = require('node-cron');
const { resetItemQuantities } = require('../services/itemUpdateService');

const startResetJob = () => {
  // Run job at the start of every hour
  cron.schedule('0 * * * *', async () => {
    await resetItemQuantities();
  }, {
    timezone: "Asia/Kolkata" // Ensures the job runs based on IST
  });
};

module.exports = { startResetJob };
