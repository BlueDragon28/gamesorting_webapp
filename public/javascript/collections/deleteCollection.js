import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";
import { hideError, setError } from "../users/userModalErrorCard.1.0.0.js";

const domModal = document.querySelector("#deleteCollectionModal");
const deleteButtonModal = document.querySelector("#deleteCollectionButton");
const bootstrapModal = new bootstrap.Modal(domModal);

const userPasswordInput = document.getElementById("deleteCollectionUserPassword");
const openModalButton = document.getElementById("open-delete-collection-modal-button");

function hideModal() {
    bootstrapModal.hide();
}

function resetInputs() {
    userPasswordInput.value = "";
}

function openModal() {
    resetInputs();
    hideError();

    bootstrapModal.show();
}

function onFinish(event) {
    const response = JSON.parse(event.target.response);

    if (response.type === "SUCCESS") {
        window.location = "/collections";
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
    xhrRequest.open("POST", `/collections/${collection.id}?_method=DELETE`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.setRequestHeader("Accept", "application/json");
    xhrRequest.send(JSON.stringify({
        collectionID: collection.id,
        password: userPassword
    }));

    hideModal();
}

deleteButtonModal.addEventListener("click", onDelete);
openModalButton.addEventListener("click", openModal);
