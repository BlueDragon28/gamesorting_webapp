import { makeAlertCard } from "../../../runtimeFlash/runtimeFlashHandler.js";

(function() {
    const domModal = document.querySelector("#deleteItemModal");
    const deleteButtonModal = document.querySelector("#deleteItemButton");

    try {
        item;
    } catch (error) {
        return;
    }

    if (!item || !domModal || !deleteButtonModal) {
        return;
    }

    const bootstrapModal = new bootstrap.Modal(domModal);

    function hideModal() {
        bootstrapModal.hide();
    }

    function onFinish(event) {
        const response = JSON.parse(event.target.response);

        if (response.type === "SUCCESS") {
            window.location = `/collections/${item.parentList.parentCollection.id}/lists/${item.parentList.id}`;
        } else {
            makeAlertCard("error", "ERROR: " + response.message);
            hideModal();
        }
    }

    function onDelete() {
        const xhrRequest = new XMLHttpRequest();
        xhrRequest.addEventListener("load", onFinish);
        xhrRequest.addEventListener("error", onFinish);
        xhrRequest.open("POST", 
            `/collections/${item.parentList.parentCollection.id}/lists/` +
            `${item.parentList.id}/items/${item.id}?_method=DELETE`);
        xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xhrRequest.setRequestHeader("Accept", "application/json")
        xhrRequest.send(JSON.stringify({
            itemID: item.id
        }));
    }

    deleteButtonModal.addEventListener("click", onDelete);
})();
