const express = require("express");
const AuthController = require("../controllers/authController");
const router = express.Router();

router.post("/", AuthController.verifyUser);
router.get("/getUser/:id", AuthController.getUser);
router.post("/signup", AuthController.signup);
router.post("/verify-otp", AuthController.verifyOTP);
router.put("/updateUser", AuthController.updateUser);
router.put("/approveUserForKitchen", AuthController.approveUserForKitchen);
router.put("/rejectUser/:id", AuthController.rejectUserForKitchen);
router.put("/updatePass", AuthController.updatePass);

module.exports = router;
