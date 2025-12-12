const AuthModel = require("../models/authModel");
const UserModel = require("../models/userModel");
const KitchenModel = require("../models/kitchenModel");
const { sendOTP } = require("../services/newSendEmail");

exports.verifyUser = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const data = await AuthModel.verifyUser(username, password);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  const id = req.params.id;

  try {
    const data = await AuthModel.getUser(id);

    const kitchenId = data ? data.kId : null;

    let getDefaultDiscount = {};
    if (kitchenId) {
      getDefaultDiscount = await KitchenModel.getDefaultDiscount(kitchenId);
    }

    const returnData = { ...data, defaultDiscount: getDefaultDiscount?.defaultDiscount||0 };

    
    res.json(returnData);
  } catch (err) {
    next(err);
  }
};

exports.signup = async (req, res) => {
  const { firstname, lastname, email, password, contact } = req.body;
  let emailStatus = "";
  try {
    const activeUser = await UserModel.getActiveUserByEmail(email);

    if (activeUser)
      return res.json({ success: false, message: "Email already exists!" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const inActiveUser = await UserModel.getInactiveUserByEmail(email);
    if (inActiveUser) {
      updateStatus = await UserModel.updateUserOTP(email, otp);
      emailStatus = await sendOTP(email, otp);
      if (
        emailStatus.success == false &&
        emailStatus.message == "No recipients defined"
      ) {
        return res.json({ success: false, message: "No recepients found" });
      } else if (emailStatus.success == false) {
        return res.json({ success: false, message: "Error" });
      } else
        return res.json({
          success: true,
          message: "User registered. OTP sent to email.",
        });
    }

    await UserModel.createUser(
      firstname,
      lastname,
      email,
      password,
      contact,
      otp
    );
    emailStatus = await sendOTP(email, otp);

    if (
      emailStatus.success == false &&
      emailStatus.message == "No recipients defined"
    ) {
      return res.json({ success: false, message: "No recepients found" });
    } else if (emailStatus.success == false) {
      return res.json({ success: false, message: "Error" });
    } else
      return res.json({
        success: true,
        message: "User registered. OTP sent to email.",
      });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await UserModel.verifyOTP(email, otp);
    if (!user) return res.json({ success: false, message: "Invalid OTP!" });

    await UserModel.updateVerifiedStatus(email);
    return res.json({ success: true, message: "Email verified successfully!" });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id, firstName, lastName, contact } = req.body;

  try {
    const result = await UserModel.updateUserDetails(
      id,
      firstName,
      lastName,
      contact
    );
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "updated successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.updatePass = async (req, res) => {
  const { id, oldPass, newPass } = req.body;

  try {
    const result = await UserModel.updatePass(id, oldPass, newPass);
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Updated successfully",
      });
    } else {
      return res
        .status(200)
        .json({ success: false, message: "Existing Password is Incorrect!" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.approveUserForKitchen = async (req, res) => {
  const { id, type } = req.body;

  try {
    const result = await UserModel.approveUserForKitchen(id, type);
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "updated successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.rejectUserForKitchen = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await UserModel.rejectUserForKitchen(id);
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "updated successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};
