const { isNumber } = require("../numbers/number");

class Pagination {
    static ITEM_PER_PAGES = 15;

    numberOfPages;
    currentPage;
    reverseOrder = false;
    isValid = false;

    constructor(currentPage = 0, numberOfItems = 0, reverseOrder = false) {
        currentPage = Number(currentPage);
        numberOfItems = Number(numberOfItems);

        if (isNumber(currentPage) && currentPage >= 0) {
            this.currentPage = currentPage;
        }

        if (isNumber(numberOfItems) && numberOfItems >= 0) {
            this.numberOfPages = 
                Math.ceil(numberOfItems / Pagination.ITEM_PER_PAGES);

            if (!this.numberOfPages || this.numberOfPages === 0) {
                this.numberOfPages = 1;
            }
        }

        this.reverseOrder = reverseOrder;

        this.isValid = typeof this.currentPage === "number" && this.currentPage >= 0 &&
                typeof this.numberOfPages === "number" && this.numberOfPages >= 1 &&
                this.currentPage <= this.numberOfPages &&
                (this.reverseOrder === true || this.reverseOrder === false);
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

    /*
    Save the reverse items order choice of the user
    */
    static saveReverseOrderMiddleware(req, res, next) {
        if (req.query.reverse !== undefined) {
            req.session.reverseItems = req.query.reverse === "true" ? true : false;
            return next();
        }

        req.session.reverseItems = false;
        next();
    }

    /*
    Restore the reverse items order choice middleware
    */
    static restoreReverseOrderMiddleware(req, res, next) {
        res.locals.isItemsReversed = req.session.reverseItems === true ? true : false;
        next();
    }
}

module.exports = Pagination;
