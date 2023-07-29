import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";

(function() {
    const searchedListUl = document.getElementById("search-lists-ul");
    const searchListForm = document.getElementById("search-lists-form");
    let selectedID = null;

    if (!searchedListUl || !searchListForm) {
        return;
    }

    const buttonsListSelector = searchedListUl.children;

    function removeAllActiveButtonClass() {
        for (const button of buttonsListSelector) {
            button.classList.remove("active");
        }
    }

    function updateSelectedItem(button, listID) {
        selectedID = listID;
        removeAllActiveButtonClass();
        button.classList.add("active");
    }


    for (const buttonSelector of buttonsListSelector) {
        const listID = buttonSelector.id.split("search-lists-select-button-")[1];
        
        if (!listID) return;

        buttonSelector.addEventListener(
            "click", 
            () => updateSelectedItem(buttonSelector, listID)
        );
    }

    function onFormSubmit(event) {
        if (!selectedID) {
            event.preventDefault();
            makeAlertCard("error", "You must select a list to import");
            return;
        }
        event.preventDefault();
    }

    searchListForm.addEventListener("submit", onFormSubmit);
})();
