import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";

(function openAskForUserDeletionModal() {
    const domModal = document.querySelector("#ask-for-user-deletion");
    const deleteUserButton = document.querySelector("#button-delete-user");
    const openModalButton = document.querySelector("#open-delete-user-modal-button");

    const currentPasswordInput = document.querySelector("#delete-current-password");

    let modal = new bootstrap.Modal(domModal);

    function resetInputs() {
        currentPasswordInput.value = "";
    }

    function openModal() {
        if (!modal) {
            return;
        }

        resetInputs();

        modal.show();
    }

    function whenProcessed(event) {
        const response = JSON.parse(event.target.response);

        if (response.type === "SUCCESS") {
            makeAlertCard("success", response.message);
        } else {
            return makeAlertCard("error", response.message);
        }

        window.location = "/";
    }

    function deleteUser() {
        const userPassword = currentPasswordInput.value;

        const xhrRequest = new XMLHttpRequest();
        xhrRequest.addEventListener("load", whenProcessed);
        xhrRequest.addEventListener("error", whenProcessed);
        xhrRequest.open("POST", "/users?_method=DELETE");
        xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhrRequest.setRequestHeader("Accept", "application/json");
        xhrRequest.send(JSON.stringify({
            deleteUser: true,
            password: userPassword
        }));
    }

    function onDeleteUser() {
        if (!modal) {
            return;
        }

        deleteUser();

        modal.hide();
    }

    openModalButton.addEventListener("click", openModal);
    deleteUserButton.addEventListener("click", onDeleteUser);
})();
