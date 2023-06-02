import postHelper from "./postHelper.js";

(function() {
    try {
        user;
    } catch (err) {
        return;
    }
    if (!user || !document.getElementById("delete-user-modal") ||
        !document.getElementById("delete-user-password") ||
        !document.getElementById("delete-user-button")) {

        return;
    }

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
