// ==========================================
// SKILLSYNC AUTH
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // PASSWORD SHOW / HIDE
    // ==========================================

    document.querySelectorAll(".toggle-password").forEach(button => {

        button.addEventListener("click", () => {

            const input =
                document.getElementById(button.dataset.target);

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
    // GET ALL REGISTERED USERS
    // ==========================================

    function getUsers() {

        return JSON.parse(
            localStorage.getItem("skillsync_users")
        ) || [];

    }


    // ==========================================
    // SAVE USERS
    // ==========================================

    function saveUsers(users) {

        localStorage.setItem(
            "skillsync_users",
            JSON.stringify(users)
        );

    }


    // ==========================================
    // SIGNUP
    // ==========================================

    const signupForm =
        document.getElementById("signupForm");


    if (signupForm) {

        signupForm.addEventListener("submit", (e) => {

            e.preventDefault();


            const name =
                document.getElementById("name")
                    .value
                    .trim();

            const email =
                document.getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document.getElementById("password")
                    .value;

            const confirmPassword =
                document.getElementById("confirmPassword")
                    .value;

            const message =
                document.getElementById("authMessage");


            // Validation
            if (
                !name ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                message.textContent =
                    "Please fill in all fields.";

                message.className =
                    "auth-message error";

                return;

            }


            if (password !== confirmPassword) {

                message.textContent =
                    "Passwords do not match.";

                message.className =
                    "auth-message error";

                return;

            }


            if (password.length < 6) {

                message.textContent =
                    "Password must be at least 6 characters.";

                message.className =
                    "auth-message error";

                return;

            }


            // Get existing users
            const users = getUsers();


            // Check duplicate email
            const existingUser =
                users.find(
                    user =>
                        user.email.toLowerCase() === email
                );


            if (existingUser) {

                message.textContent =
                    "An account with this email already exists.";

                message.className =
                    "auth-message error";

                return;

            }


            // Create new user
            const newUser = {

                id: Date.now(),

                name: name,

                email: email,

                password: password

            };


            // Add user
            users.push(newUser);


            // Save all users
            saveUsers(users);


            // Set current logged-in user
            localStorage.setItem(
                "skillsync_user",
                JSON.stringify({
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email
                })
            );


            localStorage.setItem(
                "skillsync_logged_in",
                "true"
            );


            message.textContent =
                "Account created successfully!";

            message.className =
                "auth-message success";


            setTimeout(() => {

                window.location.href =
                    "home.html";

            }, 700);

        });

    }


    // ==========================================
    // LOGIN
    // ==========================================

    const loginForm =
        document.getElementById("loginForm");


    if (loginForm) {

        loginForm.addEventListener("submit", (e) => {

            e.preventDefault();


            const email =
                document.getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document.getElementById("password")
                    .value;

            const message =
                document.getElementById("authMessage");


            if (!email || !password) {

                message.textContent =
                    "Please enter your email and password.";

                message.className =
                    "auth-message error";

                return;

            }


            // Get all registered users
            const users = getUsers();


            // Find matching user
            const user =
                users.find(
                    user =>
                        user.email.toLowerCase() === email &&
                        user.password === password
                );


            if (!user) {

                message.textContent =
                    "Incorrect email or password.";

                message.className =
                    "auth-message error";

                return;

            }


            // ==========================================
            // SET CURRENT USER
            // ==========================================

            localStorage.setItem(
                "skillsync_user",
                JSON.stringify({
                    id: user.id,
                    name: user.name,
                    email: user.email
                })
            );


            localStorage.setItem(
                "skillsync_logged_in",
                "true"
            );


            message.textContent =
                "Login successful!";

            message.className =
                "auth-message success";


            setTimeout(() => {

                window.location.href =
                    "home.html";

            }, 500);

        });

    }

});