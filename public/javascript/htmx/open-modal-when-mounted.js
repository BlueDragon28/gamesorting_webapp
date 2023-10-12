function mutationObserver(mutationList, observer) {
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            for (const element of mutation.addedNodes) {
                if (element.getAttribute("gs-new-modal") === "true") {
                    const modal = bootstrap.Modal.getOrCreateInstance(element);
                    modal.show();
                    element.removeAttribute("gm-new-modal");
                }
            }
        }
    }
}

(function() {
    const observer = new MutationObserver(mutationObserver);
    observer.observe(
        document.getElementById("modal-content-section"),
        {
            attributes: false,
            childList: true,
            subtree: false,
        },
    );
})();
