import submitEmail from "./submitEmail.js";

(function openUpdateModelOnUserRequest() {
    const modalTitle = document.querySelector("#modal-title");
    const emailUpdateDiv = document.querySelector("#email-update-input");
    const passwordUpdateDiv = document.querySelector("#password-update-input");
    const emailChangeButton = document.querySelector("#open-email-change-modal");
    const passwordChangeButton = document.querySelector("#open-password-change-modal");
    const emailSubmitButton = document.querySelector("#button-submit-new-email");
    const passwordSubmitButton = document.querySelector("#button-submit-new-password");
    
    const inputEmail = document.querySelector("#input-email");
    const inputCurrentPassword = document.querySelector("#current-password");
    const inputNewPassword = document.querySelector("#new-password");
    const inputRetypeNewPassword = document.querySelector("#retype-new-password");

    let modal;

    function resetInputs() {
        inputEmail.value = "";
        inputCurrentPassword.value = "";
        inputNewPassword.value = "";
        inputRetypeNewPassword.value = "";
    }

    function openModal() {
        resetInputs();

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

        if (!emailValue.length) {
            return;
        }

        submitEmail(emailValue);

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
})();
