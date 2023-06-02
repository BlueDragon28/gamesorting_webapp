import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";
import { hideError, setError } from "../users/userModalErrorCard.js";

function postHelper(params) {
    const modalID = params.modalID;
    const postButtonID = params.postButtonID;
    const passwordInputID = params.passwordInput;
    const openModalButtonID = params.openModalButton;
    const redirectLocation = params.redirect;
    const apiEndpoint = params.apiEndpoint;
    const dataToSend = params.data;

    if (!modalID || !postButtonID || !passwordInputID || !openModalButtonID ||
        !redirectLocation || !apiEndpoint || typeof dataToSend !== "object") {
        throw new Error("Invalid params");
    }

    const domModal = document.getElementById(modalID);
    const postButtonModal = document.getElementById(postButtonID);
    const bootstrapModal = new bootstrap.Modal(domModal);
    const passwordInput = document.getElementById(passwordInputID);
    const openModalButton = document.getElementById(openModalButtonID);

    function hideModal() {
        bootstrapModal.hide();
    }

    function resetInput() {
        passwordInput.value = "";
    }

    function openModal() {
        resetInput();
        hideError();

        bootstrapModal.show();
    }

    function onFinish(event) {
        const response = JSON.parse(event.target.response);

        if (response.type === "SUCCESS") {
            window.location = redirectLocation;
        } else {
            makeAlertCard("error", "ERROR: " + response.message);
        }
    }

    function getPassword() {
        const userPassword = passwordInput.value;

        if (!userPassword || !userPassword.length) {
            return [false, null];
        } else {
            return [true, userPassword];
        }
    }

    function onProcess() {
        const [success, password] = getPassword();

        if (!success) {
            return setError("Password cannot be empty");
        }

        const xhrRequest = new XMLHttpRequest();
        xhrRequest.addEventListener("load", onFinish);
        xhrRequest.addEventListener("error", onFinish);
        xhrRequest.open("POST", apiEndpoint);
        xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhrRequest.setRequestHeader("Accept", "application/json");
        xhrRequest.send(JSON.stringify({
            ...dataToSend,
            password: password
        }));

        hideModal();
    }

    openModalButton.addEventListener("click", openModal);
    postButtonModal.addEventListener("click", onProcess);
}

export default postHelper;
