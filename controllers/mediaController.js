const uploadToCloudinary = require("../utils/uploadToCloudinary");

const uploadMedia = async (req, res) => {
  const { role, type, id } = req.body;

  console.log("Received data on the server:", { role, type, id });

  // Basic validations
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Only allow 'user' and 'profile' type for now
  if (role !== "user" || type !== "profile") {
    return res.status(400).json({ error: "Invalid role or type" });
  }

  const folder = `users/${id}`;
  const publicId = "profile";

  try {
    const result = await uploadToCloudinary(req.file.buffer, folder, publicId);

    res.status(200).json({
      message: "Upload successful",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        folder,
      },
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

module.exports = { uploadMedia };
