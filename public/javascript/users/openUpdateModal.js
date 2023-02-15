(function openUpdateModelOnUserRequest() {
    const modalTitle = document.querySelector("#modal-title");
    const emailUpdateDiv = document.querySelector("#email-update-input");
    const passwordUpdateDiv = document.querySelector("#password-update-input");
    const emailChangeButton = document.querySelector("#open-email-change-modal");
    const passwordChangeButton = document.querySelector("#open-password-change-modal");
    const emailSubmitButton = document.querySelector("#button-submit-new-email");
    const passwordSubmitButton = document.querySelector("#button-submit-new-password");

    function openModal() {
        const myModal = new bootstrap.Modal(document.querySelector("#updateContentModal"));
        myModal.show();
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

    emailChangeButton.addEventListener("click", function() {
        openEmailModal();
    })

    passwordChangeButton.addEventListener("click", function() {
        openPasswordModal();
    });
})();
