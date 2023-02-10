const submitButton = document.querySelector("#submit_button");

submitButton.addEventListener("click", function() {
    const columnsToAddAndDelete = {
        newColumns: newColumnsList.map(column => ({ id: column.id, name: column.name, type: column.type})),
        columnsToDelete: removedColumn
    };

    const xhrRequest = new XMLHttpRequest();
    xhrRequest.open("POST", `/collections/${list.parentCollection.id}/lists/${list.id}/custom-columns`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.send(JSON.stringify(columnsToAddAndDelete));
});
