function setPaginationUrl(pageNumber) {
    if (typeof pageNumber !== "number" || pageNumber < 1 || 
            pageNumber > pagination.numberOfPages) {
        pageNumber = 1;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("pn", pageNumber);
    return url.href;
}

(function setPaginationPrevPageHRef() {
    const prevPage = document.querySelector("a[href=\"pagination_prevPage\"]");

    if (!prevPage) {
        return;
    }

    const computeUrl = setPaginationUrl(pagination.currentPage - 1);

    prevPage.href = computeUrl;
})();

(function setPagigationNextPageHRef() {
    const nextPage = document.querySelector("a[href=\"pagination_nextPage\"]");

    if (!nextPage) {
        return;
    }

    const computeUrl = setPaginationUrl(pagination.currentPage + 1);

    nextPage.href = computeUrl;
})();

(function setPaginationHRef() {
    const pages = document.querySelectorAll("a[href^=\"pagination_\"]");

    if (!pages || !pages.length) {
        return;
    }

    for (const page of pages) {
        let number;
        try {
            number = parseInt(page.href.split("_")[1].trim());
        } catch {
            return;
        }

        if (typeof number !== "number" || number < 1 || number > pagination.numberOfPages) {
            return;
        }

        const computeUrl = setPaginationUrl(number);

        page.href = computeUrl;
    }
})();

