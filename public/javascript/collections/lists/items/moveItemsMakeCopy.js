(function() {
    const makeCopyCheckBoxInput = document.getElementById("make-copy-to-new-list");
    const makeCopySubmitFormInput = document.getElementById("move-item-to-new-list-make-copy");

    if (!makeCopyCheckBoxInput || !makeCopySubmitFormInput) {
        return;
    }

    makeCopyCheckBoxInput.addEventListener("change", function() {
        makeCopySubmitFormInput.value = 
            makeCopyCheckBoxInput.checked ? "true" : "false";
    });
})();
