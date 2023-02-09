console.log(newColumnsList);

const submitButton = document.querySelector("#submit_button");

submitButton.addEventListener("click", function() {
    axios.post(`/collections/${list.parentCollection.id}/lists/${list.id}/custom-columns`, {
            newColumns: newColumnsList.map(column => ({ id: column.id, name: column.name, type: column.type})),
            columnsToDelete: removedColumn
        })
        .then(response => {
            console.log(response);
        })
        .catch(error => {
            console.log(error);
        });
});
