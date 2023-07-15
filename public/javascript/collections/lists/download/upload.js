import { makeAlertCard } from "../../../runtimeFlash/runtimeFlashHandler.js";

(function() {
    const formElement = document.getElementById("upload-file-form");
    const fileInputElement = document.getElementById("upload-file-file");

    if (!formElement || !fileInputElement) {
        return;
    }

    function submitForm(event) {
        const files = fileInputElement.files;
        
        if (!files.length || !this.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
            this.classList.add("was-validated");
            return;
        }

        const file = files[0];

        if (file.size > 2000000) { // 2 MB
            event.preventDefault();
            event.stopPropagation();
            makeAlertCard("error", "ERROR: File size must not be more than 2MB")
        }
    }

    formElement.addEventListener("submit", submitForm);
})();

