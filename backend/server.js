// ==========================================
// IMPORTS
// ==========================================

const express = require("express");
const cors = require("cors");
const multer = require("multer");

require("dotenv").config();

const { BlobServiceClient } = require("@azure/storage-blob");

const {
    DocumentAnalysisClient,
    AzureKeyCredential
} = require("@azure/ai-form-recognizer");

const OpenAI = require("openai");


// ==========================================
// EXPRESS APP
// ==========================================

const app = express();

app.use(cors());
app.use(express.json());


// ==========================================
// MULTER - RESUME UPLOAD
// ==========================================

const upload = multer({
    storage: multer.memoryStorage()
});


// ==========================================
// AZURE BLOB STORAGE
// ==========================================

const blobServiceClient =
    BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );

const containerClient =
    blobServiceClient.getContainerClient(
        process.env.AZURE_STORAGE_CONTAINER_NAME
    );


// ==========================================
// AZURE DOCUMENT INTELLIGENCE
// ==========================================

const documentClient =
    new DocumentAnalysisClient(
        process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
        new AzureKeyCredential(
            process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY
        )
    );


// ==========================================
// MICROSOFT FOUNDRY / GPT-4.1-MINI
// ==========================================

const openai = new OpenAI({
    apiKey: process.env.AZURE_FOUNDRY_API_KEY,

    baseURL:
        `${process.env.AZURE_FOUNDRY_ENDPOINT}/openai/v1`
});

const aiModel =
    process.env.AZURE_FOUNDRY_MODEL || "gpt-4.1-mini";


// ==========================================
// ROOT TEST
// ==========================================

app.get("/", (req, res) => {

    res.json({
        message: "SkillSync API is running"
    });

});


// ==========================================
// TEST GPT-4.1-MINI
// ==========================================

app.get("/test-ai", async (req, res) => {

    try {

        console.log(
            "Sending test request to gpt-4.1-mini..."
        );

        const response =
            await openai.responses.create({

                model: aiModel,

                input:
                    "Say hello to SkillSync and explain in one sentence what you can do."

            });


        console.log(
            "AI response received."
        );


        res.json({

            message:
                "gpt-4.1-mini is working",

            model:
                aiModel,

            response:
                response.output_text

        });


    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "FOUNDRY ERROR"
        );

        console.error(
            "================================="
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Status:",
            error.status
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Type:",
            error.type
        );

        console.error(error);


        res.status(500).json({

            message:
                "Failed to call gpt-4.1-mini",

            error:
                error.message,

            status:
                error.status || null,

            code:
                error.code || null

        });

    }

});


// ==========================================
// ANALYZE RESUME
// ==========================================

app.post(
    "/analyze-resume",
    async (req, res) => {

        try {

            const {
                resumeText,
                jobDescription
            } = req.body;


            // ======================================
            // VALIDATE INPUT
            // ======================================

            if (!resumeText) {

                return res.status(400).json({

                    message:
                        "resumeText is required"

                });

            }


            if (!jobDescription) {

                return res.status(400).json({

                    message:
                        "jobDescription is required"

                });

            }


            console.log(
                "================================="
            );

            console.log(
                "STARTING RESUME ANALYSIS"
            );

            console.log(
                "================================="
            );


            console.log(
                "Resume text length:",
                resumeText.length
            );

            console.log(
                "Job description length:",
                jobDescription.length
            );


            // ======================================
            // AI PROMPT
            // ======================================

            const prompt = `
You are SkillSync, an AI-powered resume analyzer.

Analyze the candidate's resume against the provided job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Evaluate the candidate based only on the information provided.

Return an objective analysis containing:

1. ATS score from 0 to 100.
2. Job match score from 0 to 100.
3. Skills clearly found in the resume.
4. Important skills required by the job description but missing from the resume.
5. Resume strengths relevant to the job.
6. Resume weaknesses relevant to the job.
7. Specific improvements the candidate should make.

Rules:

- Do not invent qualifications.
- Do not invent skills.
- Do not invent work experience.
- Do not invent certifications.
- Do not invent projects.
- Base the analysis only on the resume and job description.
- Keep the analysis concise and useful.
`;


            // ======================================
            // CALL MICROSOFT FOUNDRY
            // ======================================

            console.log(
                "Sending resume to gpt-4.1-mini..."
            );


            const response =
                await openai.responses.create({

                    model: aiModel,

                    input: prompt,

                    text: {

                        format: {

                            type: "json_schema",

                            name: "resume_analysis",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    atsScore: {
                                        type: "number"
                                    },

                                    jobMatch: {
                                        type: "number"
                                    },

                                    skills: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    },

                                    missingSkills: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    },

                                    strengths: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    },

                                    weaknesses: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    },

                                    improvements: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    }

                                },

                                required: [

                                    "atsScore",
                                    "jobMatch",
                                    "skills",
                                    "missingSkills",
                                    "strengths",
                                    "weaknesses",
                                    "improvements"

                                ],

                                additionalProperties: false

                            }

                        }

                    }

                });


            console.log(
                "AI analysis completed."
            );


            // ======================================
            // PARSE AI RESPONSE
            // ======================================

            const analysis =
                JSON.parse(
                    response.output_text
                );


            // ======================================
            // SEND RESPONSE
            // ======================================

            res.json({

                message:
                    "Resume analyzed successfully",

                model:
                    aiModel,

                analysis:
                    analysis

            });


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "RESUME ANALYSIS ERROR"
            );

            console.error(
                "================================="
            );


            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Status:",
                error.status
            );

            console.error(
                "Code:",
                error.code
            );

            console.error(
                "Type:",
                error.type
            );

            console.error(error);


            res.status(500).json({

                message:
                    "Failed to analyze resume",

                error:
                    error.message,

                status:
                    error.status || null,

                code:
                    error.code || null

            });

        }

    }
);


// ==========================================
// COMPLETE RESUME ANALYSIS
// UPLOAD → EXTRACT → AI ANALYSIS
// ==========================================

app.post(
    "/analyze-uploaded-resume",
    upload.single("resume"),
    async (req, res) => {

        try {

            // ======================================
            // CHECK FILE
            // ======================================

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "No resume uploaded"

                });

            }


            // ======================================
            // CHECK JOB DESCRIPTION
            // ======================================

            const {
                jobDescription
            } = req.body;


            if (!jobDescription) {

                return res.status(400).json({

                    message:
                        "jobDescription is required"

                });

            }


            console.log(
                "================================="
            );

            console.log(
                "STARTING COMPLETE RESUME ANALYSIS"
            );

            console.log(
                "================================="
            );


            console.log(
                "Resume:",
                req.file.originalname
            );


            // ======================================
            // STEP 1: UPLOAD TO BLOB STORAGE
            // ======================================

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


            console.log(
                "1. Resume uploaded to Blob Storage"
            );


            // ======================================
            // STEP 2: DOWNLOAD FROM BLOB
            // ======================================

            const downloadResponse =
                await blockBlobClient.download();


            if (
                !downloadResponse.readableStreamBody
            ) {

                throw new Error(
                    "Could not create readable stream from blob"
                );

            }


            console.log(
                "2. Resume downloaded from Blob Storage"
            );


            // ======================================
            // STEP 3: DOCUMENT INTELLIGENCE
            // ======================================

            console.log(
                "3. Sending resume to Document Intelligence..."
            );


            const poller =
                await documentClient.beginAnalyzeDocument(
                    "prebuilt-read",
                    downloadResponse.readableStreamBody
                );


            console.log(
                "Document Intelligence analysis started..."
            );


            const result =
                await poller.pollUntilDone();


            if (!result) {

                throw new Error(
                    "Document Intelligence returned no result"
                );

            }


            const resumeText =
                result.content || "";


            console.log(
                "4. Resume text extracted"
            );


            console.log(
                "Extracted text length:",
                resumeText.length
            );


            // ======================================
            // STEP 4: AI ANALYSIS
            // ======================================

            const prompt = `
You are SkillSync, an AI-powered resume analyzer.

Analyze the candidate's resume against the provided job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Evaluate the candidate based only on the information provided.

Return an objective analysis containing:

1. ATS score from 0 to 100.
2. Job match score from 0 to 100.
3. Skills clearly found in the resume.
4. Important skills required by the job description but missing from the resume.
5. Resume strengths relevant to the job.
6. Resume weaknesses relevant to the job.
7. Specific improvements the candidate should make.

Rules:

- Do not invent qualifications.
- Do not invent skills.
- Do not invent work experience.
- Do not invent certifications.
- Do not invent projects.
- Base the analysis only on the resume and job description.
- Keep the analysis concise and useful.
`;


            console.log(
                "5. Sending resume to gpt-4.1-mini..."
            );


            const response =
                await openai.responses.create({

                    model: aiModel,

                    input: prompt,

                    text: {

                        format: {

                            type: "json_schema",

                            name: "resume_analysis",

                            strict: true,

                            schema: {

                                type: "object",

                                properties: {

                                    atsScore: {
                                        type: "number"
                                    },

                                    jobMatch: {
                                        type: "number"
                                    },

                                    skills: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    },

                                    missingSkills: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    },

                                    strengths: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    },

                                    weaknesses: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    },

                                    improvements: {

                                        type: "array",

                                        items: {
                                            type: "string"
                                        }

                                    }

                                },

                                required: [

                                    "atsScore",
                                    "jobMatch",
                                    "skills",
                                    "missingSkills",
                                    "strengths",
                                    "weaknesses",
                                    "improvements"

                                ],

                                additionalProperties: false

                            }

                        }

                    }

                });


            console.log(
                "6. AI analysis completed"
            );


            // ======================================
            // PARSE AI RESPONSE
            // ======================================

            const analysis =
                JSON.parse(
                    response.output_text
                );


            // ======================================
            // FINAL RESPONSE
            // ======================================

            console.log(
                "================================="
            );

            console.log(
                "SKILLSYNC ANALYSIS COMPLETED"
            );

            console.log(
                "================================="
            );


            res.json({

                message:
                    "Resume analyzed successfully",

                filename:
                    req.file.originalname,

                blobName:
                    blobName,

                model:
                    aiModel,

                analysis:
                    analysis

            });


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "COMPLETE ANALYSIS ERROR"
            );

            console.error(
                "================================="
            );


            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Status:",
                error.status
            );

            console.error(
                "Code:",
                error.code
            );

            console.error(
                "Type:",
                error.type
            );

            console.error(error);


            res.status(500).json({

                message:
                    "Failed to analyze resume",

                error:
                    error.message,

                status:
                    error.status || null,

                code:
                    error.code || null

            });

        }

    }
);


// ==========================================
// UPLOAD RESUME
// ==========================================

app.post(
    "/upload-resume",
    upload.single("resume"),
    async (req, res) => {

        try {

            // ======================================
            // CHECK FILE
            // ======================================

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "No resume uploaded"

                });

            }


            console.log(
                "================================="
            );

            console.log(
                "RESUME UPLOAD"
            );

            console.log(
                "================================="
            );


            console.log(
                "Resume received:"
            );

            console.log(
                req.file.originalname
            );


            // ======================================
            // CREATE UNIQUE BLOB NAME
            // ======================================

            const blobName =
                `${Date.now()}-${req.file.originalname}`;


            // ======================================
            // GET BLOB CLIENT
            // ======================================

            const blockBlobClient =
                containerClient.getBlockBlobClient(
                    blobName
                );


            // ======================================
            // UPLOAD TO AZURE
            // ======================================

            await blockBlobClient.uploadData(
                req.file.buffer,
                {

                    blobHTTPHeaders: {

                        blobContentType:
                            req.file.mimetype

                    }

                }
            );


            console.log(
                "Resume uploaded to Azure Blob Storage"
            );


            // ======================================
            // SEND RESPONSE
            // ======================================

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
                "================================="
            );

            console.error(
                "BLOB STORAGE ERROR"
            );

            console.error(
                "================================="
            );


            console.error(error);


            res.status(500).json({

                message:
                    "Failed to upload resume",

                error:
                    error.message

            });

        }

    }
);


// ==========================================
// EXTRACT RESUME TEXT
// ==========================================

app.post(
    "/extract-resume",
    async (req, res) => {

        try {

            // ======================================
            // GET BLOB NAME
            // ======================================

            const {
                blobName
            } = req.body;


            // ======================================
            // VALIDATE BLOB NAME
            // ======================================

            if (!blobName) {

                return res.status(400).json({

                    message:
                        "blobName is required"

                });

            }


            console.log(
                "================================="
            );

            console.log(
                "RESUME TEXT EXTRACTION"
            );

            console.log(
                "================================="
            );


            console.log(
                "Blob name:",
                blobName
            );


            // ======================================
            // GET BLOB CLIENT
            // ======================================

            const blockBlobClient =
                containerClient.getBlockBlobClient(
                    blobName
                );


            // ======================================
            // CHECK IF BLOB EXISTS
            // ======================================

            const exists =
                await blockBlobClient.exists();


            if (!exists) {

                return res.status(404).json({

                    message:
                        "Resume not found in Azure Blob Storage",

                    blobName:
                        blobName

                });

            }


            console.log(
                "Resume found in Azure Blob Storage"
            );


            // ======================================
            // DOWNLOAD RESUME
            // ======================================

            const downloadResponse =
                await blockBlobClient.download();


            console.log(
                "Blob size:",
                downloadResponse.contentLength,
                "bytes"
            );


            console.log(
                "Blob content type:",
                downloadResponse.contentType
            );


            // ======================================
            // CHECK STREAM
            // ======================================

            if (
                !downloadResponse.readableStreamBody
            ) {

                throw new Error(
                    "Could not create readable stream from blob"
                );

            }


            console.log(
                "Resume downloaded from Azure Blob Storage"
            );


            // ======================================
            // DOCUMENT INTELLIGENCE
            // ======================================

            console.log(
                "Sending resume to Azure Document Intelligence..."
            );


            const poller =
                await documentClient.beginAnalyzeDocument(
                    "prebuilt-read",
                    downloadResponse.readableStreamBody
                );


            console.log(
                "Document Intelligence analysis started..."
            );


            // ======================================
            // WAIT FOR ANALYSIS
            // ======================================

            const result =
                await poller.pollUntilDone();


            console.log(
                "Document Intelligence analysis completed."
            );


            // ======================================
            // CHECK RESULT
            // ======================================

            if (!result) {

                throw new Error(
                    "Document Intelligence returned no result"
                );

            }


            // ======================================
            // EXTRACT TEXT
            // ======================================

            const extractedText =
                result.content || "";


            console.log(
                "Extracted text length:",
                extractedText.length
            );


            // ======================================
            // SEND RESPONSE
            // ======================================

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
                "================================="
            );

            console.error(
                "DOCUMENT INTELLIGENCE ERROR"
            );

            console.error(
                "================================="
            );


            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Status:",
                error.statusCode
            );

            console.error(
                "Code:",
                error.code
            );

            console.error(
                "Details:",
                error.details
            );

            console.error(error);


            res.status(500).json({

                message:
                    "Failed to extract resume text",

                error:
                    error.message,

                statusCode:
                    error.statusCode || null,

                code:
                    error.code || null

            });

        }

    }
);


// ==========================================
// START SERVER
// ==========================================

const PORT = 5000;

app.listen(
    PORT,
    () => {

        console.log(
            `SkillSync API running on http://localhost:${PORT}`
        );

        console.log(
            `AI Model: ${aiModel}`
        );

    }
);