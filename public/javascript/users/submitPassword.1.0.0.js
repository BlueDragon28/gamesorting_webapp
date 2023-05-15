import { hideError, setError } from "./userModalErrorCard.1.0.0.js";
import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";

function checkPassword(...passwords) {
    for (const password of passwords) {
        if (!password || typeof password !== "string" || !password.length) {
            return false;
        }
    }

    return true;
}

function whenProcessed(event) {
    const response = JSON.parse(event.target.response);

    if (response.type === "SUCCESS") {
        makeAlertCard("success", response.message);
    } else {
        makeAlertCard("error", "ERROR: " + response.message);
    }
} 

export default function(currentPassword, newPassword, retypedPassword) {
    if (!checkPassword(currentPassword, newPassword, retypedPassword)) {
        setError("Invalid Password!");
        return false;
    }

    if (newPassword !== retypedPassword) {
        setError("Password Are Not The Same!");
        return false;
    }

    if (newPassword === currentPassword) {
        setError("New Password Cannot Be The Same Has The Current One!");
        return false;
    }

    hideError();

    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", whenProcessed);
    xhrRequest.addEventListener("error", whenProcessed);
    xhrRequest.open("POST", "/users/password?_method=PUT");
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.setRequestHeader("Accept", "application/json");
    xhrRequest.send(JSON.stringify({
        currentPassword,
        newPassword,
        retypedPassword
    }));

    return true;
}
