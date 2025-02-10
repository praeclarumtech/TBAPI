const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const applicantRoutes = require("./routes/applicantRoutes");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
import helmet from "helmet";

dotenv.config();
connectDB();

const app = express();
app.use(helmet());


const corsOptions = {
  origin: "http://localhost:5173",
  // credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/applicant", applicantRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
