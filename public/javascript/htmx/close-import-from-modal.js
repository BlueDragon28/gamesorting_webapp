document.body.addEventListener("close-import-from-modal", function(event) {
    const myModal = bootstrap.Modal.getOrCreateInstance(event.target.closest(".modal"));
    myModal.hide();
});

document.body.addEventListener("click", function(event) {
    if (event.target.id !== "modal-import-custom-columns-from-submit-button") {
        return;
    }

    htmx.trigger(
        "#modal-import-custom-columns-from-submit-form",
        "submit"
    );
});
