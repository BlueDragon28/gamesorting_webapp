document.body.addEventListener("close-import-from-modal", function(event) {
    const myModal = bootstrap.Modal.getOrCreateInstance(event.target.closest(".modal"));
    myModal.hide();
});

document.body.addEventListener("click", function(event) {
    if (event.target.id === "modal-import-custom-columns-from-submit-button") {
        htmx.trigger(
            "#modal-import-custom-columns-from-submit-form",
            "submit",
        );
    } else if (event.target.id === "move-item-to-submit-button") {
        htmx.trigger(
            "#modal-move-item-to-submit-form",
            "submit",
        );
    }
});
