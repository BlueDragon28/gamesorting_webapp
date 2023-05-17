import submitEmail from "./submitEmail.1.0.0.js";
import submitPassword from "./submitPassword.1.0.0.js";
import { hideError, setError } from "./userModalErrorCard.1.0.0.js";

(function openUpdateModelOnUserRequest() {
    const modalTitle = document.querySelector("#modal-title");
    const emailUpdateDiv = document.querySelector("#email-update-input");
    const passwordUpdateDiv = document.querySelector("#password-update-input");
    const emailChangeButton = document.querySelector("#open-email-change-modal");
    const passwordChangeButton = document.querySelector("#open-password-change-modal");
    const emailSubmitButton = document.querySelector("#button-submit-new-email");
    const passwordSubmitButton = document.querySelector("#button-submit-new-password");
    
    const inputEmail = document.querySelector("#input-email");
    const inputPassword = document.querySelector("#input-password");
    const inputCurrentPassword = document.querySelector("#current-password");
    const inputNewPassword = document.querySelector("#new-password");
    const inputRetypeNewPassword = document.querySelector("#retype-new-password");

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

        modal = new bootstrap.Modal(document.querySelector("#updateContentModal"));
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