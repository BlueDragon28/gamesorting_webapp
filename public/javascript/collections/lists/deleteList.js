import deleteHelper from "../deleteHelper.1.0.0.js";

(function() {
    deleteHelper({
        modalID: "deleteListModal",
        deleteButtonID: "deleteListButton",
        userPasswordInputID: "deleteListUserPassword",
        openModalButtonID: "open-delete-list-modal-button",
        redirect: `/collections/${list.parentCollection.id}/`,
        apiEndpoint: `/collections/${list.parentCollection.id}/lists/${list.id}`,
        data: {
            listID: list.id,
        }
    })
})();
