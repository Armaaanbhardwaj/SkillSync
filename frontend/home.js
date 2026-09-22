// ==========================================
// SKILLSYNC DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // GET LOGGED-IN USER
    // ==========================================

    const savedUser =
        JSON.parse(
            localStorage.getItem("skillsync_user")
        );


    // ==========================================
    // USER ELEMENTS
    // ==========================================

    const userName =
        document.getElementById("userName");

    const userEmail =
        document.getElementById("userEmail");

    const welcomeName =
        document.getElementById("welcomeName");

    const userAvatar =
        document.getElementById("userAvatar");


    // ==========================================
    // DISPLAY USER
    // ==========================================

    if (savedUser) {

        const name = savedUser.name;
        const email = savedUser.email;


        // Navbar
        if (userName) {
            userName.textContent = name;
        }

        if (userEmail) {
            userEmail.textContent = email;
        }


        // Welcome message
        if (welcomeName) {
            welcomeName.textContent = name;
        }


        // Avatar
        if (userAvatar) {

            userAvatar.textContent =
                name.charAt(0).toUpperCase();

        }

    }


    // ==========================================
    // ANALYSIS HISTORY
    // ==========================================

    function getHistoryKey() {

        const user =
            JSON.parse(
                localStorage.getItem("skillsync_user")
            );

        if (!user || !user.email) {
            return null;
        }

        return `skillsync_history_${user.email.toLowerCase()}`;
    }


    function getAnalysisHistory() {

        const key = getHistoryKey();

        if (!key) {
            return [];
        }

        return JSON.parse(
            localStorage.getItem(key)
        ) || [];
    }


    // ==========================================
    // DASHBOARD STATS
    // ==========================================

    function updateDashboardStats() {

        const history = getAnalysisHistory();


        const analysisCount =
            document.getElementById("analysisCount");

        const averageMatch =
            document.getElementById("averageMatch");

        const resumeCount =
            document.getElementById("resumeCount");


        // Total analyses
        if (analysisCount) {

            analysisCount.textContent =
                history.length;

        }


        // Total resumes
        if (resumeCount) {

            resumeCount.textContent =
                history.length;

        }


        // Average match
        if (averageMatch) {

            if (history.length === 0) {

                averageMatch.textContent = "--";

            } else {

                const total =
                    history.reduce(
                        (sum, item) =>
                            sum + (Number(item.jobMatch) || 0),
                        0
                    );

                const average =
                    Math.round(
                        total / history.length
                    );

                averageMatch.textContent =
                    `${average}%`;

            }

        }

    }


    // ==========================================
    // RECENT ANALYSES
    // ==========================================

    function displayRecentAnalyses() {

        const recentAnalyses =
            document.getElementById("recentAnalyses");

        if (!recentAnalyses) return;


        const history =
            getAnalysisHistory();


        // No analyses
        if (history.length === 0) {

            recentAnalyses.innerHTML = `

                <div class="empty-analysis">

                    <div class="empty-icon">
                        <i class="fa-solid fa-file-circle-plus"></i>
                    </div>

                    <h3>No analyses yet</h3>

                    <p>
                        Upload your first resume and
                        discover your career match.
                    </p>

                    <button
                        class="empty-button"
                        onclick="window.location.href='analyzer.html'"
                    >
                        Analyze Resume
                    </button>

                </div>

            `;

            return;

        }


        // Latest 5
        recentAnalyses.innerHTML =
            history.slice(0, 5).map(item => {

                const ats =
                    Number(item.atsScore) || 0;

                const match =
                    Number(item.jobMatch) || 0;


                const atsClass =
                    ats >= 80
                        ? "good"
                        : ats >= 60
                            ? "medium"
                            : "low";


                const matchClass =
                    match >= 80
                        ? "good"
                        : match >= 60
                            ? "medium"
                            : "low";


                return `

                    <div class="analysis-row">

                        <div class="analysis-file">

                            <div class="pdf-icon">
                                <i class="fa-regular fa-file-pdf"></i>
                            </div>

                            <div class="analysis-file-info">

                                <p class="analysis-file-name">
                                    ${escapeHtml(item.filename)}
                                </p>

                                <div class="analysis-file-date">
                                    ${formatDate(item.date)}
                                </div>

                            </div>

                        </div>


                        <div class="analysis-score">

                            <span class="analysis-score-label">
                                ATS Score
                            </span>

                            <span class="score-badge ${atsClass}">
                                ${ats}%
                            </span>

                        </div>


                        <div class="analysis-score">

                            <span class="analysis-score-label">
                                Job Match
                            </span>

                            <span class="score-badge ${matchClass}">
                                ${match}%
                            </span>

                        </div>


                        <button
                            class="view-analysis"
                            onclick="viewAnalysis(${item.id})"
                        >
                            View Analysis
                        </button>

                    </div>

                `;

            }).join("");

    }


    // ==========================================
    // VIEW ANALYSIS
    // ==========================================

    window.viewAnalysis = function (id) {

        const history =
            getAnalysisHistory();


        const selected =
            history.find(
                item => item.id == id
            );


        if (!selected) {

            console.error(
                "Analysis not found:",
                id
            );

            return;

        }


        const user =
            JSON.parse(
                localStorage.getItem("skillsync_user")
            );


        if (!user || !user.email) {

            console.error(
                "No logged-in user found."
            );

            return;

        }


        const selectedKey =
            `skillsync_selected_analysis_${user.email.toLowerCase()}`;


        localStorage.setItem(
            selectedKey,
            JSON.stringify(selected)
        );


        window.location.href =
            `analyzer.html?history=${id}`;

    };
    // ==========================================
    // FORMAT DATE
    // ==========================================

    function formatDate(dateString) {

        if (!dateString) return "";

        const date =
            new Date(dateString);


        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    }


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHtml(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ==========================================
    // LOGOUT
    // ==========================================

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {

        logoutButton.addEventListener("click", () => {

            // Only remove current login session
            localStorage.removeItem("skillsync_logged_in");

            localStorage.removeItem("skillsync_user");

            // Go back to landing page
            window.location.href = "index.html";

        });

    }


    // ==========================================
    // INITIALIZE DASHBOARD
    // ==========================================

    updateDashboardStats();
    displayRecentAnalyses();

});