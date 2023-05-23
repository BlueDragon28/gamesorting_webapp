import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";
import { hideError, setError } from "../users/userModalErrorCard.1.0.0.js";

function deleteHelper(params) {
    const modalID = params.modalID;
    const deleteButtonID = params.deleteButtonID;
    const userPasswordInputID = params.userPasswordInputID;
    const openModalButtonID = params.openModalButtonID;
    const redirectLocaltion = params.redirect;
    const apiEndpoint = params.apiEndpoint;
    const dataToSend = params.data;

    if (!modalID || !deleteButtonID || !userPasswordInputID || !openModalButtonID ||
            !redirectLocaltion || !apiEndpoint || typeof dataToSend !== "object") {
        throw new Error("Invalid params");
    }

    const domModal = document.getElementById(modalID);
    const deleteButtonModal = document.getElementById(deleteButtonID);
    const bootstrapModal = new bootstrap.Modal(domModal);
    const userPasswordInput = document.getElementById(userPasswordInputID);
    const openModalButton = document.getElementById(openModalButtonID);

    function hideModal() {
        bootstrapModal.hide();
    }

    function resetInput() {
        userPasswordInput.value = "";
    }

    function openModal() {
        resetInput();
        hideError();

        bootstrapModal.show();
    }

    function onFinish(event) {
        const response = JSON.parse(event.target.response);

        if (response.type === "SUCCESS") {
            window.location = redirectLocaltion;
        } else {
            makeAlertCard("error", "ERROR: " + response.message);
        }
    }

    function getPassword() {
        const userPassword = userPasswordInput.value;

        if (!userPassword || !userPassword.length) {
            return [false, null];
        } else {
            return [true, userPassword];
        }
    }

    function onDelete() {
        const [success, userPassword] = getPassword();

        if (!success) {
            return setError("Password cannot be empty");
        }

        const xhrRequest = new XMLHttpRequest();
        xhrRequest.addEventListener("load", onFinish);
        xhrRequest.addEventListener("error", onFinish);
        xhrRequest.open("POST", apiEndpoint + "?_method=DELETE");
        xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhrRequest.setRequestHeader("Accept", "application/json");
        xhrRequest.send(JSON.stringify({
            ...dataToSend,
            password: userPassword
        }));

        hideModal();
    }

    deleteButtonModal.addEventListener("click", onDelete);
    openModalButton.addEventListener("click", openModal);
}

export default deleteHelper;