import { setError, hideError } from "../users/userModalErrorCard.1.0.0.js";
import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";

const domModal = document.getElementById("update-custom-column-info-modal");
const customColumnName = document.getElementById("modal-custom-column-title-name");
const inputName = document.getElementById("modal-custom-column-name-input");
const submitButton = document.getElementById("update-custom-column-submit-button");

const bootstrapModel = new bootstrap.Modal(domModal);

let currentCustomData;
let originalColumns;
let newColumns;
let nameDomElement;
let newName = "";

export function openDialog(customData, originalCols, newCols, nameElement) {
    currentCustomData = customData;
    originalColumns = originalCols;
    newColumns = newCols;
    nameDomElement = nameElement;

    hideError();
    customColumnName.innerText = currentCustomData.name;
    inputName.value = currentCustomData.name;
    bootstrapModel.show();
}

function onFinished(event) {
    const response = JSON.parse(event.target.response);

    if (response.type === "SUCCESS") {
        makeAlertCard("success", "SUCCESS: " + response.message);
        nameDomElement.innerText = newName;
        currentCustomData.name = newName;
    } else {
        makeAlertCard("error", "ERROR: " + response.message);
    }
}

function findDuplicate(name) {
    const lowercaseName = name.toLowerCase();

    for (const item of originalColumns) {
        if (lowercaseName === item.name.toLowerCase()) return true;
    }

    for (const item of newColumns) {
        if (lowercaseName === item.name.toLowerCase()) return true;
    }

    return false;
}

function submitData() {
    if (typeof currentCustomData !== "object") {
        return;
    }

    const inputValue = inputName.value.trim();
    if (!inputValue.length) {
        return setError("Name cannot be empty");
    } else if (inputValue === currentCustomData.name) {
        return setError("Cannot update if the name if the same as before");
    } else if (findDuplicate(inputValue)) {
        return setError("This name is already used");
    }

    newName = inputValue;

    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", onFinished);
    xhrRequest.addEventListener("error", onFinished);
    xhrRequest.open("POST", `/collections/${list.parentCollection.id}/lists/${list.id}/custom-column?_method=PUT`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.setRequestHeader("Accept", "application/json");
    xhrRequest.send(JSON.stringify({
        customColumn: {
            id: currentCustomData.id,
            name: inputValue,
            type: currentCustomData.type
        }
    }));

    bootstrapModel.hide();
}

submitButton.addEventListener("click", submitData);
