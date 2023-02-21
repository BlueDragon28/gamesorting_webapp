import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";

const domModal = document.querySelector("#deleteCollectionModal");
const deleteButtonModal = document.querySelector("#deleteCollectionButton");
const bootstrapModal = new bootstrap.Modal(domModal);

function hideModal() {
    bootstrapModal.hide();
}

function onFinish(event) {
    const response = JSON.parse(event.target.response);

    if (response.type === "SUCCESS") {
        window.location = "/collections";
    } else {
        makeAlertCard("error", "ERROR: " + response.message);
        hideModal();
    }
}

function onDelete() {
    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", onFinish);
    xhrRequest.addEventListener("error", onFinish);
    xhrRequest.open("POST", `/collections/${collection.id}?_method=DELETE`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.setRequestHeader("Accept", "application/json");
    xhrRequest.send(JSON.stringify({
        collectionID: collection.id
    }));
}

deleteButtonModal.addEventListener("click", onDelete);
