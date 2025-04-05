const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config(); // Load .env variables

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB connection using .env or fallback
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/resume_builder", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Failed:", err));

// ✅ User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// ✅ Draft Schema
const draftSchema = new mongoose.Schema({
    email: { type: String, required: true },
    name: String,
    jobTitle: String,
    contact: [String],
    education: String,
    skills: [String],
    profile: String,
    experience: String
});
const Draft = mongoose.model("Draft", draftSchema);

// ✅ Serve homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Signup route
app.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists!", redirect: "/login.html" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        console.log("✅ User registered successfully");
        res.json({ success: true, message: "Signup successful!", redirect: "/login.html" });
    } catch (error) {
        console.error("❌ Signup error:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// ✅ Signin route
app.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found. Please sign up.", redirect: "/signup.html" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password. Please try again.", redirect: "/login.html" });
        }
        console.log("✅ User logged in successfully");
        res.json({ success: true, message: "Login successful!", redirect: "/index.html" });
    } catch (error) {
        console.error("❌ Signin error:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// ✅ Save draft route
app.post("/saveDraft", async (req, res) => {
    try {
        const { email, name, jobTitle, contact, education, skills, profile, experience } = req.body;
        const existingDraft = await Draft.findOne({ email });
        if (existingDraft) {
            Object.assign(existingDraft, { name, jobTitle, contact, education, skills, profile, experience });
            await existingDraft.save();
        } else {
            const newDraft = new Draft({ email, name, jobTitle, contact, education, skills, profile, experience });
            await newDraft.save();
        }
        console.log("✅ Draft saved");
        res.json({ success: true, message: "Draft saved successfully!" });
    } catch (error) {
        console.error("❌ Draft save error:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
