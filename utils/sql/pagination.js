const { isNumber } = require("../numbers/number");
const wrapAsync = require("../errors/wrapAsync");

class Pagination {
    static ITEM_PER_PAGES = 15;

    numberOfPages;
    currentPage;
    isValid = false;

    constructor(currentPage = 0, numberOfItems = 0) {
        currentPage = Number(currentPage);
        numberOfItems = Number(numberOfItems);

        if (isNumber(currentPage) && currentPage >= 1) {
            this.currentPage = currentPage;
        }

        if (isNumber(numberOfItems) && numberOfItems >= 0) {
            this.numberOfPages = 
                Math.ceil(numberOfItems / Pagination.ITEM_PER_PAGES);

            if (!this.numberOfPages || this.numberOfPages === 0) {
                this.numberOfPages = 1;
            }
        }

        this.isValid = typeof this.currentPage === "number" && this.currentPage >= 1 &&
                typeof this.numberOfPages === "number" && this.numberOfPages >= 1 &&
                this.currentPage <= this.numberOfPages;
    }

    static calcOffset(pageNumber) {
        if (!isNumber(pageNumber) || pageNumber < 1) {
            return 0;
        }

        return (pageNumber-1) * Pagination.ITEM_PER_PAGES;
    }

    static parsePageNumberMiddleware(req, res, next) {
        let pageNumber = parseInt(req.query.pn);

        if (!pageNumber || pageNumber < 1) {
            pageNumber = 1;
        }

        req.query.pn = pageNumber;

        next();
    }
}

module.exports = Pagination;
