
const columnsListDiv = document.querySelector("#columnsList");
const customColumnForm = document.querySelector("#customColumnSubmitter");
const columnNameInput = document.querySelector("#column-name");
const columnTypeInput = document.querySelector("#column-type");
const columnNumberBlock = document.querySelector("#column-number-block");
const columnNumberMinInput = document.querySelector("#column-number-min");
const columnNumberMaxInput = document.querySelector("#column-number-max");
const columnStarBlock = document.getElementById("column-star-block");
const columnStarNumberInput = document.getElementById("column-star-number");

columnTypeInput.addEventListener("change", function(event) {
    if (columnTypeInput.value === "@Int") {
        columnNumberBlock.classList.remove("d-none");
        columnStarBlock.classList.add("d-none");
    } else if (columnTypeInput.value === "@Stars") {
        columnNumberBlock.classList.add("d-none");
        columnStarBlock.classList.remove("d-none");
    } else {
        columnNumberBlock.classList.add("d-none");
        columnStarBlock.classList.add("d-none");
    }
})

let count = 0;
let newColumnsList = [];

function parseIntTypeToHtml(columnType) {
    if (!columnType.type || isNaN(columnType.min) || isNaN(columnType.max)) {
        return "";
    }

    return `<br>Min: <b class="column-int-min">${columnType.min}</b>
        Max: <b class="column-max-int">${columnType.max}</b>`;
}

function parseStarsTypeToHtml(columnType) {
    if (!columnType.type || isNaN(columnType.max)) {
        return "";
    }

    return `<br>Max stars: <b>${columnType.max}</b>`;
}

function parseTypeToHtml(columnType) {
    if (columnType.type === "@String") {
        return "";
    } else if (columnType.type === "@Int") {
        return parseIntTypeToHtml(columnType);
    } else if (columnType.type === "@Stars") {
        return parseStarsTypeToHtml(columnType);
    }

    return "";
}

function createHtmlCustomColumn(customColumn) {
    const divContainer = document.createElement("div");
    divContainer.classList.add("list-group-item");

    const flexContainer = document.createElement("div");
    flexContainer.classList.add("d-flex", "flex-row", "justify-content-between", "align-items-center");
    divContainer.append(flexContainer);

    const pCardTitle = document.createElement("p");
    pCardTitle.classList.add("mb-1", "mt-1");
    pCardTitle.innerHTML = 
        `Name: <b class="column-name">${customColumn.name}</b>
        Type: <b class="column-type">${customColumn.type.type}</b>
        ${parseTypeToHtml(customColumn.type)}`;
    flexContainer.append(pCardTitle);

    const buttonDeleteColumn = document.createElement("button");
    buttonDeleteColumn.type = "button";
    buttonDeleteColumn.classList.add("btn-close");
    buttonDeleteColumn.addEventListener("click", 
        () => onColumnDeletion(divContainer, customColumn.fromList, customColumn.index));
    flexContainer.append(buttonDeleteColumn);

    columnsListDiv.append(divContainer);
}

for (let customColumn of listCustomColumns) {
    createHtmlCustomColumn(customColumn);
}

function resetInputs() {
    columnNameInput.value = "";
    columnTypeInput.value = "@String";
    columnNumberMinInput.value = "";
    columnNumberMaxInput.value = "";
    columnStarNumberInput.value = "";
    columnNumberBlock.classList.add("d-none");
    columnStarBlock.classList.add("d-none");
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
            min: inputMin.length > 0 ? inputMin : -2147483648,
            max: inputMax.length > 0 ? inputMax : 2147483647
        };
    }
    case "@Stars":
    {
        const inputMax = columnStarNumberInput.value;
        return {
            type,
            max: inputMax.length > 0 ? inputMax : 5
        };
    }
    }
}

function checkIfColumnDoNotExists(columnName) {
    for (let newColumn of newColumnsList) {
        if (columnName === newColumn.name) {
            return false;
        }
    }

    for (let originalColumn of listCustomColumns) {
        if (columnName === originalColumn.name && !originalColumn.invalid) {
            return false;
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
