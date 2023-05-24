import postHelper from "./postHelper.1.0.0.js";

(function() {
    postHelper({
        modalID: "delete-user-modal",
        postButtonID: "delete-user-modal-button",
        passwordInput: "delete-user-password",
        openModalButton: "delete-user-button",
        redirect: "/admin/users",
        apiEndpoint: `/admin/users/${user.id}?_method=DELETE`,
        data: {
            delete: true
        }
    });
})();
