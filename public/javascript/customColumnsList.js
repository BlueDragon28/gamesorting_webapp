const columnsListDiv = document.querySelector("#columnsList");
const customColumnForm = document.querySelector("#customColumnSubmitter");
const columnNameInput = document.querySelector("#column-name");
const columnTypeInput = document.querySelector("#column-type");

let count = 0;
const newColumnsList = [];

function parseIntTypeToHtml(columnType) {
    if (!columnType.type || isNaN(columnType.min) || isNaN(columnType.max)) {
        return "";
    }

    return `Min: <b class="column-int-min">${columnType.min}</b>
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
    divContainer.innerHTML = `
        <div class="card-body">
        <p class="card-title">
            Name: <b class="column-name">${customColumn.name}</b>
            Type: <b class="column-type">${customColumn.type.type}</b>
            ${parseTypeToHtml(customColumn.type)}
        </p>
        </div>
    `;
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
        return {
            type,
            min: 0,
            max: 200000
        };
    }
    }
}

/*
Catch the form submition and add the new column to the data list
*/
function onNewColumn(event) {
    event.preventDefault();

    const name = columnNameInput.value;


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
