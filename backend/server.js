const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
    dest: "uploads/"
});

app.get("/", (req, res) => {
    res.json({
        message: "Resume Analyzer API is running"
    });
});

app.post("/upload-resume", upload.single("resume"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            message: "No resume uploaded"
        });
    }

    res.json({
        message: "Resume uploaded successfully",
        filename: req.file.originalname
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});