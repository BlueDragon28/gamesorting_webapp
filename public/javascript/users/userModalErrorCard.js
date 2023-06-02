const errorCards = document.getElementsByClassName("modal-error-card");
const errorTextSpan = document.getElementsByClassName("modal-error-text");

function showError() {
    for (const card of errorCards) {
        card.classList.remove("d-none");
    }
}

export function hideError() {
    for (const card of errorCards) {
        card.classList.add("d-none");
    }
}

export function setError(message) {
    if (!message || typeof message !== "string" || !message.length) {
        return;
    }

    for (const errorText of errorTextSpan) {
        errorText.innerText = "ERROR: " + message;
    }
    showError();
}

