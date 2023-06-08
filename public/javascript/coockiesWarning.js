const warningDomModal = document.getElementById("cookiesWarningModal");
const acceptButton = document.getElementById("accept-essential-cookies-button");

const bootstrapModal = new bootstrap.Modal(warningDomModal);

function doesUserAlreadyAcceptedCookies() {
    const userChoice = localStorage.getItem("acceptEssentialCookies");

    return userChoice === "true";
}

function userAccepted() {
    localStorage.setItem("acceptEssentialCookies", "true");
    bootstrapModal.hide();
}

(function openModalIfNeeded() {
    if (doesUserAlreadyAcceptedCookies()) return;

    bootstrapModal.show();
})();

acceptButton.addEventListener("click", userAccepted);
