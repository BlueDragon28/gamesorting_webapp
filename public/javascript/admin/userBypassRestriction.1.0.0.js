import postHelper from "./postHelper.1.0.0.js";

(function() {
    if (!document.getElementById("stop-user-bypass-restriction-button")) return;
    postHelper({
        modalID: "bypass-restriction-modal",
        postButtonID: "modal-stop-bypass-button",
        passwordInput: "modal-bypass-admin-password",
        openModalButton: "stop-user-bypass-restriction-button",
        redirect: `/admin/users/${user.id}`,
        apiEndpoint: `/admin/users/${user.id}/bypass-restriction`,
        data: {
            bypass: false
        }
    });
})();

(function() {
    if (!document.getElementById("make-user-bypass-restriction-button")) return;
    postHelper({
        modalID: "bypass-restriction-modal",
        postButtonID: "modal-bypass-button",
        passwordInput: "modal-bypass-admin-password",
        openModalButton: "make-user-bypass-restriction-button",
        redirect: `/admin/users/${user.id}`,
        apiEndpoint: `/admin/users/${user.id}/bypass-restriction`,
        data: {
            bypass: true
        }
    });
})();
