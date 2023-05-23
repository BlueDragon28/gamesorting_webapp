import deleteHelper from "./deleteHelper.1.0.0.js";

(function() {
    deleteHelper({
        modalID: "deleteCollectionModal",
        deleteButtonID: "deleteCollectionButton",
        userPasswordInputID: "deleteCollectionUserPassword",
        openModalButtonID: "open-delete-collection-modal-button",
        redirect: "/collections",
        apiEndpoint: `/collections/${collection.id}`,
        data: {
            collectionID: collection.id           
        }
    })
})();

