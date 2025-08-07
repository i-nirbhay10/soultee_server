const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { uploadMedia } = require("../controllers/mediaController");

// POST /api/media/upload
router.post("/upload", upload.single("file"), uploadMedia);

module.exports = router;
