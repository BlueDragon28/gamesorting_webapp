import { setError, hideError } from "./userModalErrorCard.js";

const emailContentTextSpan = document.querySelector("#email-content-text");

function whenProcessed(event) {
    const response = JSON.parse(event.target.response);

    if (response.type === "SUCCESS") {
        emailContentTextSpan.innerText = response.email;
    } else {
        console.log("ERROR:", response.message);
    }
}

export default function(email) {
    if (!email.trim().length) {
        setError("Email Cannot Be Empty")
        return false;
    }

    hideError();

    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", whenProcessed);
    xhrRequest.addEventListener("error", whenProcessed);
    xhrRequest.open("POST", `/users/email?_method=PUT`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.send(JSON.stringify({
        email
    }));

    return true;
}
