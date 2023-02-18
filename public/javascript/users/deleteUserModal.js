import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";

(function openAskForUserDeletionModal() {
    const domModal = document.querySelector("#ask-for-user-deletion");
    const deleteUserButton = document.querySelector("#button-delete-user");
    const openModalButton = document.querySelector("#open-delete-user-modal-button");

    let modal = new bootstrap.Modal(domModal);

    function openModal() {
        if (!modal) {
            return;
        }

        modal.show();
    }

    function whenProcessed(event) {
        const response = JSON.parse(event.target.response);

        if (response.type === "SUCCESS") {
            makeAlertCard("success", response.message);
        } else {
            makeAlertCard("error", response.message);
        }

        window.location = "/";
    }

    function deleteUser() {
        const xhrRequest = new XMLHttpRequest();
        xhrRequest.addEventListener("load", whenProcessed);
        xhrRequest.addEventListener("error", whenProcessed);
        xhrRequest.open("POST", "/users?_method=DELETE");
        xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhrRequest.setRequestHeader("Accept", "application/json");
        xhrRequest.send(JSON.stringify({
            deleteUser: true
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
