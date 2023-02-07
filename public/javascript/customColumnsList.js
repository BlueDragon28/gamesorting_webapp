const columnsListDiv = document.querySelector("#columnsList");

function parseIntTypeToHtml(columnType) {
    if (!columnType.type || !columnType.min || !columnType.max) {
        return "";
    }
    console.log(columnType)

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
