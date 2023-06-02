import postHelper from "../../admin/postHelper.js";

(function() {
    try {
        list;
    } catch (err) {
        return;
    }

    if (!list || !document.getElementById("deleteListModal") ||
        !document.getElementById("deleteListButton") ||
        !document.getElementById("deleteListUserPassword") ||
        !document.getElementById("open-delete-list-modal-button")) {

        return;
    }

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
