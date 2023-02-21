import { makeAlertCard } from "../../runtimeFlash/runtimeFlashHandler.js";

const domModal = document.querySelector("#deleteListModal");
const deleteButtonModal = document.querySelector("#deleteListButton");
const bootstrapModal = new bootstrap.Modal(domModal);

function hideModal() {
    bootstrapModal.hide();
}

function onFinish(event) {
    const response = JSON.parse(event.target.response);

    if (response.type === "SUCCESS") {
        window.location = `/collections/${list.parentCollection.id}/`;
    } else {
        makeAlertCard("error", "ERROR: " + response.message);
        hideModal();
    }
}

function onDelete() {
    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", onFinish);
    xhrRequest.addEventListener("error", onFinish);
    xhrRequest.open("POST", `/collections/${list.parentCollection.id}/lists/${list.id}?_method=DELETE`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.setRequestHeader("Accept", "application/json")
    xhrRequest.send(JSON.stringify({
        listID: list.id
    }));
}

deleteButtonModal.addEventListener("click", onDelete);
