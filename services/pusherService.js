const pusher = require("../config/pusherConfig");

// Function to send messages to all connected devices
const sendMessageToAll = async (message) => {

  await pusher.trigger("public-channel", "new-message", { message });
};

module.exports = { sendMessageToAll };
