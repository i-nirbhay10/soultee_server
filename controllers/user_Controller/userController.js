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

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, mobile, userType, agency, company } =
      req.body;

    const allowedUserTypes = ["Individual", "Agency", "Company"];
    if (!allowedUserTypes.includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Basic validations
    if (!password || !mobile || !userType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Conditional validation based on userType
    if (userType === "Individual") {
      if (!name || !email) {
        return res.status(400).json({
          message: "Name and Email are required for Individual users.",
        });
      }
    }

    if (userType === "Agency") {
      if (
        !agency?.agencyName ||
        !agency?.agencyAddress ||
        !agency?.agencyEmail
      ) {
        return res
          .status(400)
          .json({ message: "Agency information is incomplete" });
      }
    }

    if (userType === "Company") {
      if (
        !company?.companyName ||
        !company?.companyAddress ||
        !company?.companyEmail
      ) {
        return res
          .status(400)
          .json({ message: "Company information is incomplete" });
      }
    }

    // Use the correct email for uniqueness check
    const checkEmail =
      userType === "Individual"
        ? email
        : userType === "Agency"
        ? agency?.agencyEmail
        : company?.companyEmail;
    const existingUser = await User.findOne({
      email: checkEmail.toLowerCase().trim(),
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "A user already exists with this email." });
    }

    const UNID = `UNUID-${generateUNID(checkEmail)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const newUser = new User({
      UNID,
      password: hashedPassword,
      mobile: mobile.trim(),
      userType,
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

    // Assign name/email for Individual
    if (userType === "Individual") {
      newUser.name = name.trim();
      newUser.email = email.toLowerCase().trim();
    }

    // Assign agency/company details
    if (userType === "Agency") {
      newUser.agency = {
        agencyName: agency.agencyName.trim(),
        agencyAddress: agency.agencyAddress.trim(),
        agencyEmail: agency.agencyEmail.toLowerCase().trim(),
      };
      newUser.email = agency.agencyEmail.toLowerCase().trim(); // Use agency email as login
    }

    if (userType === "Company") {
      newUser.company = {
        companyName: company.companyName.trim(),
        companyAddress: company.companyAddress.trim(),
        companyEmail: company.companyEmail.toLowerCase().trim(),
      };
      newUser.email = company.companyEmail.toLowerCase().trim(); // Use company email as login
    }

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        UNID: newUser.UNID,
        email: newUser.email,
        userType: newUser.userType,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Server error" });
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

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Derive user display name based on type
    let displayName = user.name;
    if (!displayName && user.userType === "Agency") {
      displayName = user.agency?.agencyName || "";
    } else if (!displayName && user.userType === "Company") {
      displayName = user.company?.companyName || "";
    }

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        name: displayName || "User",
        email: user.email,
        UNID: user.UNID,
        phone: user.mobile || "",
        profilePhoto: user.avatar || "",
        accountType: user.accountType || "basic",
        userType: user.userType,
        agency: user.agency || {}, // ✅ fixed: was missing a comma
        company: user.company || {}, // ✅ fixed: was missing a comma
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
exports.completeUserProfile = async (req, res) => {
  try {
    const { UNID, name, mobile, gender, profilePhoto, preferences } = req.body;

    console.log(UNID, name, mobile, gender, profilePhoto, preferences);

    const user = await User.findOne({ UNID });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Only update name for Individual users
    if (user.userType === "Individual" && typeof name === "string") {
      user.name = name.trim();
    }

    if (mobile) user.mobile = mobile;
    if (gender) user.gender = gender;
    if (profilePhoto) user.avatar = profilePhoto;

    // Merge preferences if provided
    if (preferences && typeof preferences === "object") {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

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

// ✅ Register User

// exports.registerUser = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     console.log(name, email, password);

//     if (!email || !password)
//       return res
//         .status(400)
//         .json({ message: "Email and password are required." });

//     const existingUser = await User.findOne({ email });
//     if (existingUser)
//       return res.status(400).json({ message: "Email already registered." });

//     const UNID = `UNUID-${generateUNID(email)}`;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const verificationToken = Math.floor(
//       100000 + Math.random() * 900000
//     ).toString();

//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//       UNID,
//       emailVerified: false,
//       verificationToken,
//       status: "active",
//       joinDate: new Date(),
//       preferences: {
//         notifications: true,
//         marketing: false,
//         sms: true,
//       },
//     });

//     await newUser.save();
//     // await sendVerificationEmail(email, verificationToken);

//     res.status(201).json({
//       // message: "User registered. Verification code sent to email.",
//       message: "User registered success",
//       user: {
//         email: newUser.email,
//         UNID: newUser.UNID,
//         _id: newUser._id,
//       },
//     });
//   } catch (err) {
//     console.error("Register error:", err.message);
//     res.status(500).json({ message: "Server error during registration." });
//   }
// };
