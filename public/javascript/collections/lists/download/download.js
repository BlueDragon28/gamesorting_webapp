(function(){
    const formElement = document.getElementById("download-list-form-element");
    const typeSelectInput = document.getElementById("download-list-download-type-select");
    const minimizedCheckboxInput = document.getElementById("download-list-minimized-json");

    if (!formElement || !typeSelectInput || !minimizedCheckboxInput) {
        return;
    }

    const baseUrl = `/collections/${list.parentCollection.id}/lists/${list.id}`;

    function prepareJsonUrl(isMinimized) {
        const downloadUrl = `${baseUrl}/download-json`;
        const queryString = new URLSearchParams();
        queryString.append("isMinimized", isMinimized);
        return `${downloadUrl}?${queryString.toString()}`;
    }

    function downloadList(event) {
        event.preventDefault();

        const downloadType = typeSelectInput.value;
        const isJSONMinimized = minimizedCheckboxInput.checked;

        if (downloadType === "JSON") {
            const downloadUrl = prepareJsonUrl(isJSONMinimized);
            window.location = downloadUrl;
        }
    }

    formElement.addEventListener("submit", downloadList);
})();
