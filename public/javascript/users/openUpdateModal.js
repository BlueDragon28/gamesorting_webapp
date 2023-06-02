import submitEmail from "./submitEmail.js";
import submitPassword from "./submitPassword.js";
import { hideError, setError } from "./userModalErrorCard.js";

(function openUpdateModelOnUserRequest() {
    const modalTitle = document.getElementById("modal-title");
    const emailUpdateDiv = document.getElementById("email-update-input");
    const passwordUpdateDiv = document.getElementById("password-update-input");
    const emailChangeButton = document.getElementById("open-email-change-modal");
    const passwordChangeButton = document.getElementById("open-password-change-modal");
    const emailSubmitButton = document.getElementById("button-submit-new-email");
    const passwordSubmitButton = document.getElementById("button-submit-new-password");
    
    const inputEmail = document.getElementById("input-email");
    const inputPassword = document.getElementById("input-password");
    const inputCurrentPassword = document.getElementById("current-password");
    const inputNewPassword = document.getElementById("new-password");
    const inputRetypeNewPassword = document.getElementById("retype-new-password");

    const domModal = document.getElementById("updateContentModal");

    if (!modalTitle || !emailUpdateDiv || !passwordUpdateDiv ||
        !emailChangeButton || !passwordChangeButton ||
        !emailSubmitButton || !passwordSubmitButton ||
        !inputEmail || !inputPassword || !inputCurrentPassword || 
        !inputNewPassword || !inputRetypeNewPassword) {

        return;
    }

    let modal;

    function resetInputs() {
        inputEmail.value = "";
        inputPassword.value = "";
        inputCurrentPassword.value = "";
        inputNewPassword.value = "";
        inputRetypeNewPassword.value = "";
    }

    function openModal() {
        resetInputs();
        hideError();

        modal = new bootstrap.Modal(domModal);
        modal.show();
    }

    function openEmailModal() {
        modalTitle.innerText = "Change Email";

        emailUpdateDiv.classList.remove("d-none");
        emailSubmitButton.classList.remove("d-none");
        passwordUpdateDiv.classList.add("d-none");
        passwordSubmitButton.classList.add("d-none");
        openModal();
    }

    function openPasswordModal() {
        modalTitle.innerText = "Change Password";

        emailUpdateDiv.classList.add("d-none");
        emailSubmitButton.classList.add("d-none");
        passwordUpdateDiv.classList.remove("d-none");
        passwordSubmitButton.classList.remove("d-none");
        openModal();
    }

    function sendEmail() {
        if (!modal) {
            return;
        }

        const emailValue = inputEmail.value.trim();
        const passwordValue = inputPassword.value.trim();

        if (!submitEmail(emailValue, passwordValue)) {
            return;
        }

        modal.hide();
    }

    function sendPassword() {
        if (!modal) {
            return;
        }

        const currentPasswordValue = inputCurrentPassword.value.trim();
        const newPasswordValue = inputNewPassword.value.trim();
        const retypedPasswordValue = inputRetypeNewPassword.value.trim();

        if (!currentPasswordValue.length ||
            !newPasswordValue.length ||
            !retypedPasswordValue.length) {
            setError("Password Cannot Be Empty");
            return;
        }

        if (!submitPassword(currentPasswordValue, newPasswordValue, retypedPasswordValue)) {
            return;
        }

        modal.hide();
    }

    emailChangeButton.addEventListener("click", function() {
        openEmailModal();
    })

    passwordChangeButton.addEventListener("click", function() {
        openPasswordModal();
    });

    emailSubmitButton.addEventListener("click", function() {
        sendEmail();
    });

    passwordSubmitButton.addEventListener("click", function() {
        sendPassword();
    });
})();
