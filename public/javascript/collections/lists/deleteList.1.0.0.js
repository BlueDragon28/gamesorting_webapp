import postHelper from "../../admin/postHelper.1.0.0.js";

(function() {
    postHelper({
        modalID: "deleteListModal",
        postButtonID: "deleteListButton",
        passwordInput: "deleteListUserPassword",
        openModalButton: "open-delete-list-modal-button",
        redirect: `/collections/${list.parentCollection.id}/`,
        apiEndpoint: `/collections/${list.parentCollection.id}/lists/${list.id}?_method=DELETE`,
        data: {
            listID: list.id,
        }
    })
})();
