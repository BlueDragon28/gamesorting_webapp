import { makeAlertCard } from "../../runtimeFlash/runtimeFlashHandler.js";
import { hideError, setError } from "../../users/userModalErrorCard.1.0.0.js";

const domModal = document.querySelector("#deleteListModal");
const deleteButtonModal = document.querySelector("#deleteListButton");
const bootstrapModal = new bootstrap.Modal(domModal);

const userPasswordInput = document.getElementById("deleteListUserPassword");
const openModalButton = document.getElementById("open-delete-list-modal-button");

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
        window.location = `/collections/${list.parentCollection.id}/`;
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
    xhrRequest.open("POST", `/collections/${list.parentCollection.id}/lists/${list.id}?_method=DELETE`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.setRequestHeader("Accept", "application/json")
    xhrRequest.send(JSON.stringify({
        listID: list.id,
        password: userPassword
    }));

    hideModal();
}

deleteButtonModal.addEventListener("click", onDelete);
openModalButton.addEventListener("click", openModal);