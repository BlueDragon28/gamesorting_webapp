import { makeAlertCard } from "./runtimeFlashHandler.js";

(function displayServerMessages() {
    for (let flashMessage of serverFlashMessages) {
        const messageType = flashMessage.type === "success" ? "success" : "danger";
        const message = flashMessage.message;

        makeAlertCard(messageType, message);
    }
})();
