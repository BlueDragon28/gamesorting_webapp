function mutationObserver(mutationList, observer) {
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            for (const element of mutation.addedNodes) {
                if (
                    element.getAttribute &&
                    element.getAttribute("gs-new-modal") === "true"
                ) {
                    const modal = bootstrap.Modal.getOrCreateInstance(element);
                    modal.show();
                    element.removeAttribute("gm-new-modal");
                }
            }
        }
    }
}

function addObservable(element) {
    const observer = new MutationObserver(mutationObserver);
    observer.observe(
        element,
        {
            attributes: false,
            childList: true,
            subtree: false,
        },
    );
};

export function addObserverToModalContentSection(element) {
    const modalContentBlock = element.id === "modal-content-section" ?
        element :
        element.querySelector("[id=\"modal-content-section\"]");

    if (!modalContentBlock) return;
    if (modalContentBlock.classList.contains("is-watched")) return;

    addObservable(modalContentBlock);
    modalContentBlock.classList.add("is-watched");
}

(function() {
    addObservable(document.getElementById("modal-content-section"));
})();
