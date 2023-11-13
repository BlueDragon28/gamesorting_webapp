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

    /*
    * Run execution on next tick to be sure bootstrap had time to initialize.
    */
    setTimeout(function() {
        const modalSection = document.getElementById("modal-content-section");

        const modalElement = document.createElement("div");
        modalElement.id = "accept-essential-cookies-modal";
        modalElement.classList.add("modal", "fade");
        modalElement.setAttribute("tabindex", "-1");
        modalElement.setAttribute("aria-labelledby", "acceptEssentialCookiesModalLabel");
        modalElement.setAttribute("aria-hidden", "true");
        modalElement.setAttribute("data-bs-backdrop", "static");
        modalElement.setAttribute("data-bs-keyboard", "false");
        modalElement.innerHTML = `
<div class="modal-dialog">
    <div class="modal-content">
        <div class="modal-header">
            <h1 class="modal-title fs-5">This Web App Use Cookies</h1>
        </div>
        <div class="modal-body">
            <p>This web app use only cookies that are essential to work properly.<br>
                It may also store some data into the local storage of your web browsers (including your anwser to this dialog).</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" id="accept-essential-cookies-button">Accept Essential Cookies</button>
        </div>
    </div>
</div>
`;

        modalSection.append(modalElement);
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();

        modalElement.querySelector("#accept-essential-cookies-button")?.addEventListener(
            "click",
            function(_) {
                modal.hide();
                modalElement.remove();
                userAccepted();
            },
        );
    }, 0);
})();
