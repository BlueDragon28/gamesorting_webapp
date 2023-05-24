import postHelper from "../admin/postHelper.1.0.0.js";

(function() {
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

