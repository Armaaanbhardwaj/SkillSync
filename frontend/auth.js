// ==========================================
// SKILLSYNC AUTH
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // PASSWORD SHOW / HIDE
    // ==========================================

    document.querySelectorAll(".toggle-password").forEach(button => {

        button.addEventListener("click", () => {

            const input = document.getElementById(button.dataset.target);

            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                button.textContent = "Hide";
            } else {
                input.type = "password";
                button.textContent = "Show";
            }

        });

    });


    // ==========================================
    // SIGNUP
    // ==========================================

    const signupForm = document.getElementById("signupForm");

    if (signupForm) {

        signupForm.addEventListener("submit", (e) => {

            e.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword =
                document.getElementById("confirmPassword").value;

            const message = document.getElementById("authMessage");


            // Validation
            if (!name || !email || !password || !confirmPassword) {

                message.textContent = "Please fill in all fields.";
                message.className = "auth-message error";

                return;
            }


            if (password !== confirmPassword) {

                message.textContent = "Passwords do not match.";
                message.className = "auth-message error";

                return;
            }


            if (password.length < 6) {

                message.textContent =
                    "Password must be at least 6 characters.";

                message.className = "auth-message error";

                return;
            }


            // ==========================================
            // SAVE USER
            // ==========================================

            const user = {
                name: name,
                email: email
            };

            localStorage.setItem(
                "skillsync_user",
                JSON.stringify(user)
            );


            // Mark user as logged in
            localStorage.setItem(
                "skillsync_logged_in",
                "true"
            );


            message.textContent =
                "Account created successfully!";

            message.className = "auth-message success";


            // Redirect to dashboard
            setTimeout(() => {

                window.location.href = "home.html";

            }, 700);

        });

    }


    // ==========================================
    // LOGIN
    // ==========================================

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", (e) => {

            e.preventDefault();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            const message =
                document.getElementById("authMessage");


            if (!email || !password) {

                message.textContent =
                    "Please enter your email and password.";

                message.className = "auth-message error";

                return;
            }


            // ==========================================
            // GET SAVED USER
            // ==========================================

            const savedUser =
                JSON.parse(
                    localStorage.getItem("skillsync_user")
                );


            if (!savedUser) {

                message.textContent =
                    "No account found. Please create an account first.";

                message.className = "auth-message error";

                return;
            }


            // Check email
            if (
                savedUser.email.toLowerCase() !==
                email.toLowerCase()
            ) {

                message.textContent =
                    "Incorrect email or password.";

                message.className = "auth-message error";

                return;
            }


            // ==========================================
            // LOGIN SUCCESS
            // ==========================================

            localStorage.setItem(
                "skillsync_logged_in",
                "true"
            );


            message.textContent =
                "Login successful!";

            message.className = "auth-message success";


            setTimeout(() => {

                window.location.href = "home.html";

            }, 500);

        });

    }

});