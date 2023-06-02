import postHelper from "../admin/postHelper.1.0.0.js";

(function() {
    try {
        collection;
    } catch (err) {
        return;
    }

    if (!collection || !document.getElementById("deleteCollectionModal") ||
        !document.getElementById("deleteCollectionButton") ||
        !document.getElementById("deleteCollectionUserPassword") ||
        !document.getElementById("open-delete-collection-modal-button")) {

        return;
    }

    postHelper({
        modalID: "deleteCollectionModal",
        postButtonID: "deleteCollectionButton",
        passwordInput: "deleteCollectionUserPassword",
        openModalButton: "open-delete-collection-modal-button",
        redirect: "/collections",
        apiEndpoint: `/collections/${collection.id}?_method=DELETE`,
        data: {
            collectionID: collection.id           
        }
    })
})();

