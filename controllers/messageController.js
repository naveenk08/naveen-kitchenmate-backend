const { sendMessageToAll } = require("../services/pusherService");

// API to send message to all users
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    await sendMessageToAll(message);

    res.json({ success: true, message: "Message sent to all connected devices" });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { sendMessage };
