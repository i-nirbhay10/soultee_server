const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.use("/webhook", require("./routes/webhook"));

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Routes
app.use("/api/users", require("./routes/user_route/userRoutes"));
app.use("/api/media", require("./routes/mediaRoutes")); // 👈 New route
app.use("/api/payment", require("./routes/payment/payment"));
app.use("/api/paymentsHistory", require("./routes/PaymentHistoryRoutes"));
// app.use("/webhook", require("./routes/webhook"));
app.use("/api/service", require("./routes/serviceRoutes"));

// Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
