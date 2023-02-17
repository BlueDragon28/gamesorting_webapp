const runtimeFlashContainer = document.querySelector("#runtime-flash-container");

export function makeAlertCard(type, message) {
    if (!type || typeof type !== "string" || !type.length ||
        !message || typeof message !== "string" || !message.length) {
        return null;
    }

    const alertCard = document.createElement("div");
    alertCard.classList.add(
        "alert",
        "alert-" + (type === "success" ? "success" : "danger"),
        "alert-dismissible",
        "fade",
        "show"
    );
    alertCard.setAttribute("role", "alert");
    alertCard.innerText = message;

    const dismissButton = document.createElement("button");
    dismissButton.type = "button";
    dismissButton.classList.add("btn-close");
    dismissButton.setAttribute("data-bs-dismiss", "alert");
    dismissButton.setAttribute("aria-label", "Close");

    alertCard.append(dismissButton);
    runtimeFlashContainer.append(alertCard);
}
