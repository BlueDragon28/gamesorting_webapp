function getListIDFromLocation() {
    const currentLocation = window.location.pathname;
    const valueRegex = /^\/collections\/lists\/([0-9]+)$/
    if (!valueRegex.test(currentLocation)) {
        throw new Error("Cannot make a search request");
    }

    const listID = parseInt(currentLocation.match(valueRegex)[1]);
    if (listID === undefined || isNaN(listID)) {
        throw new Error("Failed to get listID number");
    }

    return listID;
}

function submitEvent(searchInput) {
    if (!searchInput) {
        return console.error("Invalid search input");
    }

    const searchTerm = searchInput.value;

    const collectionsItemsList = document.getElementById("collections-items-list-row");
    if (!collectionsItemsList) {
        return console.error("collection items list not available!");
    }

    console.log(`preparing a search with term: ${searchTerm}`);

    let listID;
    try {
        listID = getListIDFromLocation();
    } catch (e) {
        return console.log(e.message);
    }

    console.log(`current listID is ${listID}`);

    htmx.ajax(
        "GET",
        `/collections/lists/${listID}?onlyItems=true`,
        {
            target: collectionsItemsList,
            swap:"outerHTML",
            headers: {
                "GS-searchTerm": searchTerm,
            },
        },
    )
        .then(() => {
            console.log("Request Success");
        })
        .catch((_) => {
            console.error("Oups: something went wrong!");
        });
}

document.body.addEventListener("submit", function(event) {
    if (event.target.id !== "search-box") {
        return;
    }

    event.preventDefault();
    console.log("prevent default");
    
    const searchInput = event.target.firstElementChild;
    submitEvent(searchInput);
});
