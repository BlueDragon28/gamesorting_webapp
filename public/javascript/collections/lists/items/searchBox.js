let searchBlock;
let exactMathCheckbox;
let regexCheckbox;
let searchInput;
let cancelButton;
let searchButton;

function handleRegexChange(event) {
    const isEnabled = event.target.checked;
    exactMathCheckbox.disabled = isEnabled;
}

function onCancelSearch() {
    const locationUrl = new URL(window.location).toString();
    const newUrl = 
        locationUrl.split(/[?#]/)[0];
    window.location = newUrl;
}

function onSubmitSearch() {
    const exactMatch = exactMathCheckbox.checked;
    const regex = regexCheckbox.checked;
    const searchText= searchInput.value;

    const data = {
        text: searchText.trim(),
        regex,
        exactMatch : regex ? false : exactMatch
    };

    submitData(data);
}

function submitData(data) {
    const url = new URL(window.location.toString());
    url.searchParams.set("sm", data.exactMatch ? "true" : "false");
    url.searchParams.set("sr", data.regex ? "true" : "false");
    url.searchParams.set("st", data.text);
    window.location = url.toString();
}

(function() {
    searchBlock = document.getElementById("search-items-block");
    exactMathCheckbox = document.getElementById("search-exact-match");
    regexCheckbox = document.getElementById("search-regex");
    searchInput = document.getElementById("search-text-input");
    cancelButton = document.getElementById("cancel-search-button");
    searchButton = document.getElementById("submit-search-button");

    if (!searchBlock || !exactMathCheckbox || !regexCheckbox ||
        !searchInput || !cancelButton || !searchButton) {
        return;
    }

    regexCheckbox.addEventListener("change", handleRegexChange);
    cancelButton.addEventListener("click", onCancelSearch);
    searchButton.addEventListener("click", onSubmitSearch);
})();
