const errorCard = document.querySelector("#modal-error-card");
const errorText = document.querySelector("#modal-error-text");

function showError() {
    errorCard.classList.remove("d-none");
}

export function hideError() {
    errorCard.classList.add("d-none");
}

export function setError(message) {
    if (!message || typeof message !== "string" || !message.length) {
        return;
    }

    errorText.innerText = "ERROR: " + message;
    showError();
}

