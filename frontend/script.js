
const API_URL = "http://localhost:5000/api/auth";

const authForm = document.getElementById("authForm");
const nameField = document.getElementById("nameField");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submitButton");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const switchLabel = document.getElementById("switchLabel");
const switchButton = document.getElementById("switchButton");
const messageBox = document.getElementById("message");

let isRegisterMode = false;

function showMessage(message, type = "error") {
    messageBox.textContent = message;
    messageBox.className = `message show ${type}`;
}

function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "message";
}

function setMode(registerMode) {
    isRegisterMode = registerMode;
    clearMessage();
    authForm.reset();

    nameField.classList.toggle("hidden", !isRegisterMode);
    nameInput.required = isRegisterMode;

    formTitle.textContent = isRegisterMode
        ? "Create your account"
        : "Welcome back";

    formSubtitle.textContent = isRegisterMode
        ? "Register to get started with DG Interns Hub."
        : "Sign in to continue to your account.";

    submitButton.textContent = isRegisterMode
        ? "Create account"
        : "Sign in";

    switchLabel.textContent = isRegisterMode
        ? "Already have an account?"
        : "Don't have an account?";

    switchButton.textContent = isRegisterMode
        ? "Sign in"
        : "Create account";

    passwordInput.autocomplete = isRegisterMode
        ? "new-password"
        : "current-password";
}

switchButton.addEventListener("click", () => {
    setMode(!isRegisterMode);
});

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const payload = {
        email: emailInput.value.trim(),
        password: passwordInput.value
    };

    if (isRegisterMode) {
        payload.name = nameInput.value.trim();
    }

    submitButton.disabled = true;
    submitButton.textContent = "Please wait...";

    try {
        const endpoint = isRegisterMode ? "register" : "login";

        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const validationMessage = data.errors
                ?.map(error => error.msg)
                .join(", ");

            throw new Error(
                validationMessage ||
                data.message ||
                "Something went wrong."
            );
        }

        if (isRegisterMode) {
            showMessage(
                "Account created successfully! You can now sign in.",
                "success"
            );

            setMode(false);
            showMessage(
                "Account created successfully! Please sign in.",
                "success"
            );

            return;
        }

        // Store the login token for the next authenticated request.
        // Do not expose this token in the page or console.
        sessionStorage.setItem("authToken", data.token);

        showMessage("Login successful! Opening your dashboard...", "success");

        window.location.href = "dashboard.html";
    } catch (error) {
        if (error instanceof TypeError) {
            showMessage(
                "Cannot connect to the backend. Check that your server is running."
            );
        } else {
            showMessage(error.message || "Request failed.");
        }
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = isRegisterMode
            ? "Create account"
            : "Sign in";
    }
});

setMode(false);


