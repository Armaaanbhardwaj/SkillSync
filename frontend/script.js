// ==========================================
// SKILLSYNC ANALYZER FRONTEND
// ==========================================


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const resumeInput =
    document.getElementById("resume");

const uploadArea =
    document.querySelector(".upload-area");

const jobDescription =
    document.getElementById("jobDescription");

const analyzeButton =
    document.getElementById("analyzeButton");

const loading =
    document.getElementById("loading");

const results =
    document.getElementById("results");


// ==========================================
// FILE SELECTION
// ==========================================

if (resumeInput) {

    resumeInput.addEventListener(
        "change",
        function () {

            const file = this.files[0];

            if (!file) {
                return;
            }


            // ==================================
            // CHECK PDF
            // ==================================

            if (
                file.type !== "application/pdf" &&
                !file.name
                    .toLowerCase()
                    .endsWith(".pdf")
            ) {

                alert(
                    "Please upload a PDF file."
                );

                resumeInput.value = "";

                return;
            }


            // ==================================
            // CHECK SIZE
            // ==================================

            const maxSize =
                4 * 1024 * 1024;


            if (file.size > maxSize) {

                alert(
                    "PDF must be smaller than 4 MB."
                );

                resumeInput.value = "";

                return;
            }


            // ==================================
            // FILE SIZE
            // ==================================

            const fileSize =
                (
                    file.size /
                    (1024 * 1024)
                ).toFixed(2);


            // ==================================
            // UPDATE UPLOAD UI
            // ==================================

            uploadArea.classList.add(
                "file-selected"
            );


            uploadArea.innerHTML = `

                <div class="selected-file-icon">
                    ✓
                </div>

                <div class="selected-file-info">

                    <strong
                        title="${escapeHtml(file.name)}"
                    >
                        ${escapeHtml(file.name)}
                    </strong>

                    <span>
                        PDF • ${fileSize} MB
                    </span>

                </div>

                <button
                    type="button"
                    class="change-file"
                    id="changeFile"
                >
                    Change file
                </button>

            `;


            // Put original input back
            uploadArea.appendChild(
                resumeInput
            );


            // ==================================
            // CHANGE FILE
            // ==================================

            const changeFile =
                document.getElementById(
                    "changeFile"
                );


            if (changeFile) {

                changeFile.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();

                        resumeInput.click();

                    }
                );

            }

        }
    );

}


// ==========================================
// ANALYZE RESUME
// ==========================================

if (analyzeButton) {

    analyzeButton.addEventListener(
        "click",
        async function () {


            // ==================================
            // CHECK RESUME
            // ==================================

            if (
                !resumeInput ||
                !resumeInput.files ||
                resumeInput.files.length === 0
            ) {

                alert(
                    "Please upload your resume first."
                );

                return;
            }


            // ==================================
            // CHECK JOB DESCRIPTION
            // ==================================

            const jobText =
                jobDescription.value.trim();


            if (!jobText) {

                alert(
                    "Please enter the job description."
                );

                jobDescription.focus();

                return;
            }


            // ==================================
            // GET FILE
            // ==================================

            const resumeFile =
                resumeInput.files[0];


            // ==================================
            // CREATE FORM DATA
            // ==================================

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


            // ==================================
            // LOADING
            // ==================================

            analyzeButton.disabled = true;

            analyzeButton.innerHTML = `
                <span class="button-spinner"></span>
                Analyzing...
            `;


            if (loading) {
                loading.hidden = false;
            }


            if (results) {
                results.hidden = true;
            }


            try {

                // ==================================
                // SEND TO BACKEND
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
                // RESPONSE
                // ==================================

                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        data.message ||
                        "Resume analysis failed."
                    );

                }


                // ==================================
                // GET ANALYSIS
                // ==================================

                const analysis =
                    data.analysis;


                if (!analysis) {

                    throw new Error(
                        "No analysis was returned by the server."
                    );

                }


                // ==================================
                // DISPLAY RESULTS
                // ==================================

                displayResults(
                    analysis
                );


                // ==================================
                // SAVE HISTORY
                // ==================================

                saveRecentAnalysis({

                    filename:
                        resumeFile.name,

                    atsScore:
                        analysis.atsScore,

                    jobMatch:
                        analysis.jobMatch,

                    skills:
                        analysis.skills || [],

                    missingSkills:
                        analysis.missingSkills || [],

                    strengths:
                        analysis.strengths || [],

                    weaknesses:
                        analysis.weaknesses || [],

                    improvements:
                        analysis.improvements || [],

                    jobDescription:
                        jobText

                });


                // ==================================
                // HIDE LOADING
                // ==================================

                if (loading) {
                    loading.hidden = true;
                }


                // ==================================
                // SHOW RESULTS
                // ==================================

                if (results) {

                    results.hidden = false;

                    setTimeout(() => {

                        results.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }, 100);

                }


            } catch (error) {

                console.error(
                    "SkillSync Error:",
                    error
                );


                alert(
                    `Analysis failed: ${error.message}`
                );


                if (loading) {
                    loading.hidden = true;
                }

            } finally {

                // ==================================
                // RESET BUTTON
                // ==================================

                analyzeButton.disabled = false;

                analyzeButton.innerHTML = `
                    Analyze Resume
                    <span>→</span>
                `;

            }

        }
    );

}


// ==========================================
// SAVE RECENT ANALYSIS
// ==========================================

function saveRecentAnalysis(analysis) {

    const history =
        JSON.parse(
            localStorage.getItem(
                "skillsync_history"
            )
        ) || [];


    const newAnalysis = {

        id: Date.now(),

        filename:
            analysis.filename,

        atsScore:
            Number(analysis.atsScore || 0),

        jobMatch:
            Number(analysis.jobMatch || 0),

        skills:
            analysis.skills || [],

        missingSkills:
            analysis.missingSkills || [],

        strengths:
            analysis.strengths || [],

        weaknesses:
            analysis.weaknesses || [],

        improvements:
            analysis.improvements || [],

        jobDescription:
            analysis.jobDescription || "",

        date:
            new Date().toISOString()

    };


    // Newest analysis first
    history.unshift(
        newAnalysis
    );


    // Keep latest 10
    const limitedHistory =
        history.slice(0, 10);


    localStorage.setItem(
        "skillsync_history",
        JSON.stringify(
            limitedHistory
        )
    );

}


// ==========================================
// DISPLAY RESULTS
// ==========================================

function displayResults(analysis) {

    document.getElementById(
        "atsScore"
    ).textContent =
        analysis.atsScore ?? 0;


    document.getElementById(
        "jobMatch"
    ).textContent =
        analysis.jobMatch ?? 0;


    displayTags(
        "skills",
        analysis.skills
    );


    displayTags(
        "missingSkills",
        analysis.missingSkills
    );


    displayList(
        "strengths",
        analysis.strengths
    );


    displayList(
        "weaknesses",
        analysis.weaknesses
    );


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


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !Array.isArray(items) ||
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


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (
        !Array.isArray(items) ||
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


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value || "";


    return div.innerHTML;

}

// ==========================================
// VIEW SAVED ANALYSIS
// ==========================================

function loadSavedAnalysis() {
    const params = new URLSearchParams(window.location.search);
    const historyId = params.get("history");

    if (!historyId) {
        return;
    }

    const savedAnalysis = localStorage.getItem("skillsync_selected_analysis");

    if (!savedAnalysis) {
        console.error("No saved analysis found.");
        return;
    }

    try {
        const analysis = JSON.parse(savedAnalysis);

        // Display the saved analysis
        displayResults(analysis);

        // Show results section
        if (results) {
            results.hidden = false;
        }

        // Hide loading section
        if (loading) {
            loading.hidden = true;
        }

        // Change button text
        if (analyzeButton) {
            analyzeButton.textContent = "Analyze New Resume";
        }

        // Scroll to results
        setTimeout(() => {
            if (results) {
                results.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }, 300);

    } catch (error) {
        console.error("Error loading saved analysis:", error);
    }
}

loadSavedAnalysis();