const submitButton = document.querySelector("#submit_button");

async function onRequestFinish(event) {
    const response = JSON.parse(event.target.response);
    if (response.type === "SUCCESS") {
        window.location = `/collections/${list.parentCollection.id}/lists/${list.id}`;
        console.log("SUCCESS:", response.message);
    } else {
        const { makeAlertCard } = await import("../runtimeFlash/runtimeFlashHandler.js");
        makeAlertCard("error", "ERROR: " + response.message);
    }
}

submitButton.addEventListener("click", function() {
    const columnsToAddAndDelete = {
        newColumns: newColumnsList.map(column => ({ id: column.id, name: column.name, type: column.type}))
    };

    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", onRequestFinish);
    xhrRequest.addEventListener("error", onRequestFinish);
    xhrRequest.open("POST", `/collections/${list.parentCollection.id}/lists/${list.id}/custom-columns`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.setRequestHeader("Accept", "application/json");
    xhrRequest.send(JSON.stringify(columnsToAddAndDelete));
});
