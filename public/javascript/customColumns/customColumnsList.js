
const columnsListDiv = document.querySelector("#columnsList");
const customColumnForm = document.querySelector("#customColumnSubmitter");
const columnNameInput = document.querySelector("#column-name");
const columnTypeInput = document.querySelector("#column-type");
const columnNumberBlock = document.querySelector("#column-number-block");
const columnNumberMinInput = document.querySelector("#column-number-min");
const columnNumberMaxInput = document.querySelector("#column-number-max");

columnTypeInput.addEventListener("change", function(event) {
    if (columnTypeInput.value === "@Int") {
        columnNumberBlock.classList.remove("d-none");
    } else {
        columnNumberBlock.classList.add("d-none");
    }
})

let count = 0;
let newColumnsList = [];
const removedColumn = [];

function parseIntTypeToHtml(columnType) {
    if (!columnType.type || isNaN(columnType.min) || isNaN(columnType.max)) {
        return "";
    }

    return `<br>Min: <b class="column-int-min">${columnType.min}</b>
        Max: <b class="column-max-int">${columnType.max}</b>`;
}

function parseTypeToHtml(columnType) {
    if (columnType.type === "@String") {
        return "";
    } else if (columnType.type === "@Int") {
        return parseIntTypeToHtml(columnType);
    }

    return "";
}

function createHtmlCustomColumn(customColumn) {
    const divContainer = document.createElement("div");
    divContainer.classList.add("card");

    const divCardBoby = document.createElement("div");
    divCardBoby.classList.add("card-body");
    divContainer.append(divCardBoby);

    const pCardTitle = document.createElement("p");
    pCardTitle.classList.add("card-title");
    pCardTitle.innerHTML = 
        `Name: <b class="column-name">${customColumn.name}</b>
        Type: <b class="column-type">${customColumn.type.type}</b>
        ${parseTypeToHtml(customColumn.type)}`;
    divCardBoby.append(pCardTitle);

    const buttonDeleteColumn = document.createElement("button");
    buttonDeleteColumn.type = "button";
    buttonDeleteColumn.classList.add("btn", "btn-danger", "btn-sm");
    buttonDeleteColumn.innerText = "Delete";
    buttonDeleteColumn.addEventListener("click", 
        () => onColumnDeletion(divContainer, customColumn.fromList, customColumn.index));
    divCardBoby.append(buttonDeleteColumn);

    columnsListDiv.append(divContainer);
}

for (let customColumn of listCustomColumns) {
    createHtmlCustomColumn(customColumn);
}

function resetInputs() {
    columnNameInput.value = "";
    columnTypeInput.value = "@String";
}

/*
Generate the type object of the newly created element
*/
function parseType() {
    const type = columnTypeInput.value;

    switch (type) {
    case "@String":
    {
        return {
            type
        };
    }
    case "@Int":
    {
        const inputMin = columnNumberMinInput.value;
        const inputMax = columnNumberMaxInput.value;
        return {
            type,
            min: inputMin.length > 0 ? inputMin : 0,
            max: inputMax.length > 0 ? inputMax : 20000
        };
    }
    }
}

function checkIfColumnNotRemoved(columnName) {
    for (let columnRemoved of removedColumn) {
        if (columnName === columnRemoved.name) {
            return false;
        }
    } 

    return true;
}

function checkIfColumnDoNotExists(columnName) {
    for (let newColumn of newColumnsList) {
        if (columnName === newColumn.name) {
            return false;
        }
    }

    for (let originalColumn of listCustomColumns) {
        if (columnName === originalColumn.name) {
            if (checkIfColumnNotRemoved(columnName)) return false;
        }
    }

    return true;
}

/*
Catch the form submition and add the new column to the data list
*/
function onNewColumn(event) {
    event.preventDefault();

    const name = columnNameInput.value.trim(); 

    const isColumnNotExist = checkIfColumnDoNotExists(name);

    if (!isColumnNotExist || name.length === 0) {
        return;
    }

    const newCustomColumn = {
        id: "-1",
        name,
        type: parseType(),
        index: count++,
        fromList: "new"
    };
    newColumnsList.push(newCustomColumn);

    resetInputs();

    createHtmlCustomColumn(newCustomColumn);
}

customColumnForm.addEventListener("submit", onNewColumn);

/*
Remove a column the user selected
*/
async function onColumnDeletion(divContainer, fromList, index) {
    if (fromList === "original") {
        const originalColumn = listCustomColumns[index];
        const { openDeleteModal } = await import("./deleteColumns.js");
        openDeleteModal(divContainer, originalColumn);
    } else if (fromList === "new") {
        newColumnsList = newColumnsList.filter(column => column.index !== index);
        divContainer.remove();
    }
}
