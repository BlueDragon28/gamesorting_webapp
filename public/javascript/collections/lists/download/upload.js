(function() {
    const formElement = document.getElementById("upload-file-form");
    const fileInputElement = document.getElementById("upload-file-file");

    if (!formElement || !fileInputElement) {
        return;
    }

    function submitForm(event) {
        const files = fileInputElement.files;
        
        if (!files.length) {
            console.log("You must add a file!");
            event.preventDefault();
            return;
        }

        const file = files[0];

        if (file.size > 1000000) { // 1 MB
            console.log("The file is too big");
            event.preventDefault();
            return;
        }

        console.log("Everything is good");
        event.preventDefault();
    }

    formElement.addEventListener("submit", submitForm);
})();
