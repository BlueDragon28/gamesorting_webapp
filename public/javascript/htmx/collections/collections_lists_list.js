(function() {
    const listCollectionsLists = document.getElementById("collections-lists-list-button");

    if (!listCollectionsLists) return;

    const listButtons = listCollectionsLists.children;

    function clearSelection() {
        for (button of listButtons) {
            button.classList.remove("active");
        }
    }

    function select(event) {
        clearSelection();
        this.classList.add("active");
        event.stopPropagation();
    }


    for (button of listButtons) {
        button.addEventListener("click", select);
    }

    listCollectionsLists.addEventListener("click", clearSelection);
})();
