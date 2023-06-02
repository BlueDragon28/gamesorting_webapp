import { setError, hideError } from "./userModalErrorCard.js";
import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";

const emailContentTextSpan = document.querySelector("#email-content-text");

function whenProcessed(event) {
    const response = JSON.parse(event.target.response);

    if (response.type === "SUCCESS") {
        emailContentTextSpan.innerText = response.email;
        makeAlertCard("success", response.message);
    } else {
        makeAlertCard("error", response.message);
    }
}

export default function(email, password) {
    if (!email.trim().length) {
        setError("Email cannot be empty")
        return false;
    }

    if (!password.trim().length) {
        setError("Password cannot be empty");
        return false;
    }

    hideError();

    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", whenProcessed);
    xhrRequest.addEventListener("error", whenProcessed);
    xhrRequest.open("POST", `/users/email?_method=PUT`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.setRequestHeader("Accept", "application/json");
    xhrRequest.send(JSON.stringify({
        email,
        password
    }));

    return true;
}
