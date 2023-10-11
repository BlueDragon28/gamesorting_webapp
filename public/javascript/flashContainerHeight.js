(function() {
    const runtimeFlashContainer = document.getElementById("runtime-flash-container");

    if (!runtimeFlashContainer) return;

    function mutationObserver(mutationList, observer) {
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

    const observer = new MutationObserver(mutationObserver);
    observer.observe(
        runtimeFlashContainer,
        {
            childList: true,
        },
    );

})();
