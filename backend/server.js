// =========================================================
// SkillSync Backend
// =========================================================

// Load environment variables FIRST
require("dotenv").config();




// =========================================================
// IMPORTS
// =========================================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const { BlobServiceClient } = require("@azure/storage-blob");

const {
    DocumentAnalysisClient,
    AzureKeyCredential
} = require("@azure/ai-form-recognizer");

const OpenAI = require("openai");

const auth = require("./auth");


// =========================================================
// APP
// =========================================================

const app = express();

const PORT = process.env.PORT || 5000;


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// =========================================================
// SERVE FRONTEND
// =========================================================

// This allows:
// http://localhost:5000/frontend/index.html
// http://localhost:5000/frontend/login.html
// http://localhost:5000/frontend/signup.html
// http://localhost:5000/frontend/home.html
// http://localhost:5000/frontend/analyzer.html

app.use(
    "/frontend",
    express.static(
        path.join(__dirname, "../frontend")
    )
);


// =========================================================
// MULTER
// =========================================================

// Files are temporarily stored in memory before
// being uploaded to Azure Blob Storage.

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 4 * 1024 * 1024
    }
});


// =========================================================
// AZURE BLOB STORAGE
// =========================================================

const blobServiceClient =
    BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );

const containerClient =
    blobServiceClient.getContainerClient(
        process.env.AZURE_STORAGE_CONTAINER_NAME || "resumes"
    );


// =========================================================
// AZURE DOCUMENT INTELLIGENCE
// =========================================================

const documentClient =
    new DocumentAnalysisClient(
        process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
        new AzureKeyCredential(
            process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY
        )
    );


// =========================================================
// MICROSOFT FOUNDRY / AZURE OPENAI
// =========================================================

const openai = new OpenAI({
    apiKey: process.env.AZURE_FOUNDRY_API_KEY,

    baseURL:
        `${process.env.AZURE_FOUNDRY_ENDPOINT}/openai/v1`
});


// =========================================================
// HOME / API TEST
// =========================================================

app.get("/", (req, res) => {

    res.json({
        message: "SkillSync backend is running",
        status: "OK"
    });

});


// =========================================================
// AUTH ROUTES
// =========================================================

// Signup
app.post(
    "/api/auth/signup",
    auth.signup
);


// Login
app.post(
    "/api/auth/login",
    auth.login
);


// =========================================================
// TEST AI
// =========================================================

app.get("/test-ai", async (req, res) => {

    try {

        const response =
            await openai.chat.completions.create({

                model:
                    process.env.AZURE_FOUNDRY_MODEL ||
                    "gpt-4.1-mini",

                messages: [
                    {
                        role: "user",
                        content:
                            "Say hello to SkillSync in one sentence."
                    }
                ],

                max_tokens: 100
            });


        res.json({

            message:
                `${process.env.AZURE_FOUNDRY_MODEL || "gpt-4.1-mini"} is working`,

            model:
                process.env.AZURE_FOUNDRY_MODEL ||
                "gpt-4.1-mini",

            response:
                response.choices[0].message.content

        });

    } catch (error) {

        console.error(
            "Foundry AI Error:",
            error
        );

        res.status(500).json({

            message: "AI request failed",

            error:
                error.message

        });

    }

});


// =========================================================
// UPLOAD RESUME
// =========================================================

app.post(
    "/upload-resume",
    upload.single("resume"),

    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please upload a resume."

                });

            }


            // Generate unique blob name
            const blobName =
                `${Date.now()}-${req.file.originalname}`;


            // Get block blob client
            const blockBlobClient =
                containerClient.getBlockBlobClient(
                    blobName
                );


            // Upload file
            await blockBlobClient.uploadData(
                req.file.buffer,
                {
                    blobHTTPHeaders: {
                        blobContentType:
                            req.file.mimetype
                    }
                }
            );


            res.json({

                message:
                    "Resume uploaded successfully",

                filename:
                    req.file.originalname,

                blobName:
                    blobName

            });

        } catch (error) {

            console.error(
                "Blob upload error:",
                error
            );

            res.status(500).json({

                message:
                    "Resume upload failed",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// EXTRACT RESUME TEXT
// =========================================================

app.post(
    "/extract-resume",

    async (req, res) => {

        try {

            const {
                blobName
            } = req.body;


            if (!blobName) {

                return res.status(400).json({

                    message:
                        "blobName is required."

                });

            }


            // Download blob
            const blockBlobClient =
                containerClient.getBlockBlobClient(
                    blobName
                );


            const downloadResponse =
                await blockBlobClient.download();


            const chunks = [];


            for await (
                const chunk
                of downloadResponse.readableStreamBody
            ) {

                chunks.push(chunk);

            }


            const buffer =
                Buffer.concat(chunks);


            // Send document to Azure Document Intelligence
            const poller =
                await documentClient.beginAnalyzeDocument(
                    "prebuilt-read",
                    buffer
                );


            const result =
                await poller.pollUntilDone();


            let extractedText = "";


            if (result.pages) {

                for (const page of result.pages) {

                    if (page.lines) {

                        for (const line of page.lines) {

                            extractedText +=
                                line.content + "\n";

                        }

                    }

                }

            }


            res.json({

                message:
                    "Resume text extracted successfully",

                blobName:
                    blobName,

                text:
                    extractedText

            });

        } catch (error) {

            console.error(
                "Document Intelligence error:",
                error
            );

            res.status(500).json({

                message:
                    "Resume extraction failed",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// ANALYZE UPLOADED RESUME
// =========================================================

app.post(
    "/analyze-uploaded-resume",

    upload.single("resume"),

    async (req, res) => {

        try {

            // -------------------------------------------------
            // Validate resume
            // -------------------------------------------------

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please upload a resume."

                });

            }


            // -------------------------------------------------
            // Validate job description
            // -------------------------------------------------

            const jobDescription =
                req.body.jobDescription;


            if (!jobDescription) {

                return res.status(400).json({

                    message:
                        "Please provide a job description."

                });

            }


            // -------------------------------------------------
            // Upload resume to Blob Storage
            // -------------------------------------------------

            const blobName =
                `${Date.now()}-${req.file.originalname}`;


            const blockBlobClient =
                containerClient.getBlockBlobClient(
                    blobName
                );


            await blockBlobClient.uploadData(
                req.file.buffer,
                {
                    blobHTTPHeaders: {
                        blobContentType:
                            req.file.mimetype
                    }
                }
            );


            // -------------------------------------------------
            // Extract resume text
            // -------------------------------------------------

            const poller =
                await documentClient.beginAnalyzeDocument(
                    "prebuilt-read",
                    req.file.buffer
                );


            const result =
                await poller.pollUntilDone();


            let resumeText = "";


            if (result.pages) {

                for (const page of result.pages) {

                    if (page.lines) {

                        for (const line of page.lines) {

                            resumeText +=
                                line.content + "\n";

                        }

                    }

                }

            }


            // -------------------------------------------------
            // AI Analysis
            // -------------------------------------------------

            const prompt = `
You are an AI resume analyzer.

Analyze the following resume against the provided job description.

Return ONLY valid JSON.

The JSON must have exactly these fields:

{
    "atsScore": number,
    "jobMatch": number,
    "skills": [],
    "missingSkills": [],
    "strengths": [],
    "weaknesses": [],
    "improvements": []
}

Rules:

- atsScore must be between 0 and 100.
- jobMatch must be between 0 and 100.
- skills should contain relevant skills found in the resume.
- missingSkills should contain important skills required by the job but missing from the resume.
- strengths should contain specific strengths based on the resume.
- weaknesses should contain genuine gaps or limitations relative to the job.
- improvements should contain practical suggestions.
- Do not invent experience that is not present in the resume.

RESUME:

${resumeText}

JOB DESCRIPTION:

${jobDescription}
`;


            const completion =
                await openai.chat.completions.create({

                    model:
                        process.env.AZURE_FOUNDRY_MODEL ||
                        "gpt-4.1-mini",

                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a professional AI resume analyzer. Always return valid JSON."
                        },

                        {
                            role: "user",
                            content: prompt
                        }
                    ],

                    temperature: 0.2,

                    response_format: {
                        type: "json_object"
                    }

                });


            const aiResponse =
                completion.choices[0]
                    .message
                    .content;


            const analysis =
                JSON.parse(aiResponse);


            // -------------------------------------------------
            // Final response
            // -------------------------------------------------

            res.json({

                message:
                    "Resume analyzed successfully",

                filename:
                    req.file.originalname,

                blobName:
                    blobName,

                model:
                    process.env.AZURE_FOUNDRY_MODEL ||
                    "gpt-4.1-mini",

                analysis:
                    analysis

            });

        } catch (error) {

            console.error(
                "Resume analysis error:",
                error
            );

            res.status(500).json({

                message:
                    "Resume analysis failed",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {

    res.status(404).json({

        message:
            "Route not found",

        path:
            req.originalUrl

    });

});


// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Server error:",
            error
        );


        res.status(
            error.status || 500
        ).json({

            message:
                error.message ||
                "Internal server error"

        });

    }
);


// =========================================================
// START SERVER
// =========================================================

app.listen(
    PORT,
    () => {

        console.log(
            `SkillSync server running on http://localhost:${PORT}`
        );

        console.log(
            `Frontend available at http://localhost:${PORT}/frontend/index.html`
        );

    }
);