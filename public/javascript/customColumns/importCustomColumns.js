//import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";
import { makeAlertCard } from "../runtimeFlash/runtimeFlashHandler.js";

(function() {
    const searchedListUl = document.getElementById("search-lists-ul");
    const searchListForm = document.getElementById("search-lists-form");
    const DOMConfirmModal = document.getElementById("search-lists-accept-modal");
    const modalListNameSpan = document.getElementById("search-lists-accept-modal-list-name");
    const modalAcceptButton = document.getElementById("search-lists-accept-modal-accept-button");
    const submitIDForm = document.getElementById("search-lists-submit-list-id-form");
    const submitIDFormField = document.getElementById("search-lists-submit-list-id-input");

    let selectedID = null;

    if (
        !searchedListUl || 
        !searchListForm ||
        !DOMConfirmModal ||
        !modalListNameSpan ||
        !modalAcceptButton ||
        !submitIDForm ||
        !submitIDFormField
    ) {
        return;
    }

    const confirmModal = new bootstrap.Modal(DOMConfirmModal);

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

        for (const searchedList of searchedLists) {
            if (searchedList.id === selectedID) {
                modalListNameSpan.innerText = 
                    `${searchedList.parentCollection.name}/${searchedList.name}`;
                break;
            }
        }

        confirmModal.show();
        event.preventDefault();
    }

    function onUserAccept() {
        submitIDFormField.value = selectedID;
        submitIDForm.submit();
    }

    searchListForm.addEventListener("submit", onFormSubmit);
    modalAcceptButton.addEventListener("click", onUserAccept);
})();
