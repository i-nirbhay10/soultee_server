const User = require("../../models/user_model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendVerificationEmail,
  sendWelcomeEmail,
} = require("../../models/shared/email");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 🔐 Generate Unique UNID
function generateUNID(email) {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hour = now.getHours().toString().padStart(2, "0");
  const minute = now.getMinutes().toString().padStart(2, "0");
  const namePart = email
    .split("@")[0]
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase();

  return `${namePart}${year}${month}${day}${hour}${minute}`.slice(0, 12);
}

// ✅ Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log(name, email, password);

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered." });

    const UNID = `UNUID-${generateUNID(email)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      UNID,
      emailVerified: false,
      verificationToken,
      status: "active",
      joinDate: new Date(),
      preferences: {
        notifications: true,
        marketing: false,
        sms: true,
      },
    });

    await newUser.save();
    // await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      // message: "User registered. Verification code sent to email.",
      message: "User registered success",
      user: {
        email: newUser.email,
        UNID: newUser.UNID,
        _id: newUser._id,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// ✅ Verify Email
exports.verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.emailVerified)
      return res.status(400).json({ message: "Email already verified." });

    if (user.verificationToken !== token.toString())
      return res.status(400).json({ message: "Invalid verification token." });

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    await sendWelcomeEmail(email, "user");

    res.status(200).json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("Verification error:", err.message);
    res.status(500).json({ message: "Server error during verification." });
  }
};

// ✅ Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password, "email, password");

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);

    console.log(isMatch, "user");
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });

    // if (!user.emailVerified) {
    //   const newToken = Math.floor(100000 + Math.random() * 900000).toString();
    //   user.verificationToken = newToken;
    //   await user.save();
    //   await sendVerificationEmail(email, newToken);

    //   return res.status(200).json({
    //     message: "Email not verified. Verification code re-sent.",
    //   });
    // }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        name: user.name || " ",
        email: user.email,
        UNID: user.UNID,
        phone: user.phone || " ",
        profilePhoto: user.avatar || "", // Consistent naming
        accountType: user.accountType,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
};

// ✅ Get User by UNID
exports.getUserByUNID = async (req, res) => {
  try {
    const { UNID } = req.query;
    if (!UNID) return res.status(400).json({ message: "UNID is required." });

    const user = await User.findOne({ UNID });
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ user });
  } catch (err) {
    console.error("Get user error:", err.message);
    res.status(500).json({ message: "Server error fetching user." });
  }
};

// ✅ Complete Profile
// ✅ Complete Profile
exports.completeUserProfile = async (req, res) => {
  try {
    const { UNID, name, phone, gender, profilePhoto, bio, preferences } =
      req.body;

    const user = await User.findOne({ UNID });
    if (!user) return res.status(404).json({ message: "User not found." });

    // Update fields if provided
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.gender = gender || user.gender;
    user.avatar = profilePhoto || user.avatar; // Match formData
    user.bio = bio || user.bio;
    user.preferences = preferences || user.preferences;
    user.profileStatus = "completed";
    user.isProfileComplete = true;
    user.lastActive = new Date();

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};
