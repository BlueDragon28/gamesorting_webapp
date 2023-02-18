import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";

// Store the last event handler set
let deleteColumnButtonEventHandler;

const deleteColumnModal = document.querySelector("#ask-for-delete-current-col");
const columnNameText = document.querySelector("#modal-col-name-title");
const deleteColumnButton = document.querySelector("#modal-button-delete-custom-column");
const bootstrapModal = new bootstrap.Modal(deleteColumnModal);

export function openDeleteModal(divContainer, customColumn) {
    columnNameText.innerText = customColumn.name;

    function whenProcessed(event) {
        const response = JSON.parse(event.target.response);

        if (response.type === "SUCCESS") {
            makeAlertCard("success", "SUCCESS: " + response.message)
            divContainer.remove();
            customColumn.invalid = true;
        } else {
            makeAlertCard("errror", "ERROR: " + response.message);
        }

        bootstrapModal.hide();
    }

    function onDeleteColumn() {
        const xhrRequest = new XMLHttpRequest();
        xhrRequest.addEventListener("load", whenProcessed);
        xhrRequest.addEventListener("error", whenProcessed);
        xhrRequest.open("POST", `/collections/${list.parentCollection.id}/lists/${list.id}/custom-column?_method=DELETE`);
        xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhrRequest.setRequestHeader("Accept", "application/json");
        xhrRequest.send(JSON.stringify({
            customColumn: {
                id: customColumn.id,
                name: customColumn.name,
                type: customColumn.type
            }
        }));
    }

    if (deleteColumnButtonEventHandler) {
        deleteColumnButton.removeEventListener("click", 
            deleteColumnButtonEventHandler);
    }

    deleteColumnButton.addEventListener("click", onDeleteColumn);
    deleteColumnButtonEventHandler = onDeleteColumn;

    bootstrapModal.show();
}
