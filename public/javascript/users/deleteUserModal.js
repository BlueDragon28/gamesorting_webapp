import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";
import { hideError, setError } from "./userModalErrorCard.js";

(function openAskForUserDeletionModal() {
    const domModal = document.getElementById("ask-for-user-deletion");
    const deleteUserButton = document.getElementById("button-delete-user");
    const openModalButton = document.getElementById("open-delete-user-modal-button");
    const currentPasswordInput = document.getElementById("delete-current-password");

    if (!domModal || !deleteUserButton || !openModalButton || !currentPasswordInput) {
        return;
    }

    let modal = new bootstrap.Modal(domModal);

    function resetInputs() {
        currentPasswordInput.value = "";
    }

    function openModal() {
        if (!modal) {
            return;
        }

        resetInputs();
        hideError();

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

        if (!currentPasswordInput.value.length) {
            setError("Password cannot be empty");
            return;
        }

        deleteUser();

        modal.hide();
    }

    openModalButton.addEventListener("click", openModal);
    deleteUserButton.addEventListener("click", onDeleteUser);
})();
