// Check if forms are valid before sending them.
(() => {
    const forms = document.querySelectorAll(".needs-validation");

    for (let form of forms) {
        form.addEventListener("submit", function(event) {
            if (!this.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }

            this.classList.add("was-validated");
        });
    }
})();