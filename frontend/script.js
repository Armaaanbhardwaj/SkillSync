// ==========================================
// SKILLSYNC FRONTEND
// ==========================================


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const resumeInput =
    document.getElementById("resume");

const fileName =
    document.getElementById("file-name");

const jobDescription =
    document.getElementById("jobDescription");

const analyzeButton =
    document.getElementById("analyzeButton");

const status =
    document.getElementById("status");

const statusText =
    document.getElementById("status-text");

const results =
    document.getElementById("results");


// ==========================================
// FILE SELECTION
// ==========================================

resumeInput.addEventListener(
    "change",
    () => {

        if (resumeInput.files.length === 0) {

            fileName.textContent = "";

            return;
        }


        const file =
            resumeInput.files[0];


        fileName.textContent =
            `Selected: ${file.name}`;

    }
);


// ==========================================
// ANALYZE RESUME
// ==========================================

analyzeButton.addEventListener(
    "click",
    async () => {

        // ======================================
        // VALIDATE RESUME
        // ======================================

        if (resumeInput.files.length === 0) {

            alert(
                "Please upload your resume first."
            );

            return;
        }


        // ======================================
        // VALIDATE JOB DESCRIPTION
        // ======================================

        const jobText =
            jobDescription.value.trim();


        if (!jobText) {

            alert(
                "Please enter the job description."
            );

            return;
        }


        // ======================================
        // GET FILE
        // ======================================

        const resumeFile =
            resumeInput.files[0];


        // ======================================
        // CHECK FILE TYPE
        // ======================================

        if (
            resumeFile.type !==
            "application/pdf"
        ) {

            alert(
                "Please upload a PDF resume."
            );

            return;
        }


        // ======================================
        // CREATE FORM DATA
        // ======================================

        const formData =
            new FormData();


        formData.append(
            "resume",
            resumeFile
        );


        formData.append(
            "jobDescription",
            jobText
        );


        // ======================================
        // SHOW LOADING
        // ======================================

        analyzeButton.disabled = true;

        analyzeButton.textContent =
            "Analyzing...";


        status.hidden = false;

        statusText.textContent =
            "Uploading and analyzing your resume...";


        // Hide previous results
        results.hidden = true;


        try {

            // ==================================
            // SEND REQUEST TO BACKEND
            // ==================================

            const response =
                await fetch(
                    "http://localhost:5000/analyze-uploaded-resume",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            // ==================================
            // GET RESPONSE
            // ==================================

            const data =
                await response.json();


            // ==================================
            // CHECK RESPONSE
            // ==================================

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Something went wrong."
                );

            }


            // ==================================
            // GET ANALYSIS
            // ==================================

            const analysis =
                data.analysis;


            // ==================================
            // DISPLAY RESULTS
            // ==================================

            displayResults(
                analysis
            );


            // ==================================
            // HIDE LOADING
            // ==================================

            status.hidden = true;


            // ==================================
            // SHOW RESULTS
            // ==================================

            results.hidden = false;


            // Scroll to results
            results.scrollIntoView({
                behavior: "smooth"
            });


        } catch (error) {

            console.error(
                "SkillSync Error:",
                error
            );


            alert(
                `Analysis failed: ${error.message}`
            );


            status.hidden = true;

        } finally {

            // ==================================
            // RESET BUTTON
            // ==================================

            analyzeButton.disabled = false;

            analyzeButton.textContent =
                "Analyze Resume";

        }

    }
);


// ==========================================
// DISPLAY RESULTS
// ==========================================

function displayResults(analysis) {


    // ======================================
    // ATS SCORE
    // ======================================

    document.getElementById(
        "atsScore"
    ).textContent =
        analysis.atsScore;


    // ======================================
    // JOB MATCH
    // ======================================

    document.getElementById(
        "jobMatch"
    ).textContent =
        analysis.jobMatch;


    // ======================================
    // SKILLS
    // ======================================

    displayTags(
        "skills",
        analysis.skills
    );


    // ======================================
    // MISSING SKILLS
    // ======================================

    displayTags(
        "missingSkills",
        analysis.missingSkills
    );


    // ======================================
    // STRENGTHS
    // ======================================

    displayList(
        "strengths",
        analysis.strengths
    );


    // ======================================
    // WEAKNESSES
    // ======================================

    displayList(
        "weaknesses",
        analysis.weaknesses
    );


    // ======================================
    // IMPROVEMENTS
    // ======================================

    displayList(
        "improvements",
        analysis.improvements
    );

}


// ==========================================
// DISPLAY TAGS
// ==========================================

function displayTags(
    elementId,
    items
) {

    const container =
        document.getElementById(
            elementId
        );


    container.innerHTML = "";


    if (
        !items ||
        items.length === 0
    ) {

        const tag =
            document.createElement(
                "span"
            );


        tag.className =
            "tag";


        tag.textContent =
            "None identified";


        container.appendChild(
            tag
        );


        return;
    }


    items.forEach(
        (item) => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "tag";


            tag.textContent =
                item;


            container.appendChild(
                tag
            );

        }
    );

}


// ==========================================
// DISPLAY LIST
// ==========================================

function displayList(
    elementId,
    items
) {

    const list =
        document.getElementById(
            elementId
        );


    list.innerHTML = "";


    if (
        !items ||
        items.length === 0
    ) {

        const li =
            document.createElement(
                "li"
            );


        li.textContent =
            "None identified";


        list.appendChild(
            li
        );


        return;
    }


    items.forEach(
        (item) => {

            const li =
                document.createElement(
                    "li"
                );


            li.textContent =
                item;


            list.appendChild(
                li
            );

        }
    );

}