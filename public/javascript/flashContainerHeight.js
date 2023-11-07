import { addObserverToModalContentSection } from "./htmx/open-modal-when-mounted";

function mutationObserver(mutationList, observer) {
    const runtimeFlashContainer = document.getElementById("runtime-flash-container");
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            if (runtimeFlashContainer.children.length > 0) {
                runtimeFlashContainer.classList.add("has-children");
            } else {
                runtimeFlashContainer.classList.remove("has-children");
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
}

export function addObserverToRuntimeFlashSection(element) {
    const runtimeFlashContentBlock = element.id === "runtime-flash-container" ?
        element :
        element.querySelector("[id=\"runtime-flash-container\"]");

    if (!runtimeFlashContentBlock) return;
    if (runtimeFlashContentBlock.classList.contains("is-watched")) return;

    addObservable(runtimeFlashContentBlock);
    runtimeFlashContentBlock.classList.add("is-watched");
}

(function() {
    addObservable(document.getElementById("runtime-flash-container"));
})();
