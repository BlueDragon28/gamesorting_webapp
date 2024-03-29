const { isNumber } = require("../numbers/number");

class Pagination {
    static ITEM_PER_PAGES = process.env.NODE_ENV === "test" ?
        15 : 30;

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

    static parseItemsPageNumberMiddleware(req, res, next) {
        const { listID } = req.params;

        let pageNumber = parseInt(req.query.pn);

        if (pageNumber) {
            pageNumber = pageNumber >= 1 ? pageNumber : 1;
        } else if (
                req.session.itemsPageNumber?.listID === listID &&
                req.session.itemsPageNumber?.pageNumber !== undefined &&
                req.session.itemsPageNumber?.pageNumber >= 1) {

            pageNumber = req.session.itemsPageNumber.pageNumber;
        } else {
            pageNumber = 1;
        }

        req.query.pn = pageNumber;
        req.session.itemsPageNumber = {
            listID,
            pageNumber
        }

        next();
    }

    /*
    Save or restore the reverse items order choice of the user
    */
    static async saveRestoreReverseItemsOrderMiddleware(req, res, next) {
        if (typeof req.query.reverse === "string" && req.query.reverse.length) {
            req.query.reverse = req.query.reverse === "true" ? true : false;
        }

        next();
    }

    /*
    Parse incoming search options
    */
    static parseSearchOptions(req, res, next) {
        const { listID } = req.params;

        if (req.session.searchParams) {
            if (req.session.searchParams?.listID !== listID) {
                delete req.session.searchParams;
            }
        }

        const isExactMatch = req.query.sm;
        const isRegex = req.query.sr;
        const text = req.query.st;

        if (typeof isExactMatch !== "boolean" || typeof isRegex !== "boolean" || 
                    typeof text !== "string" || !listID) {

            return next();
        }

        if (!text.length) {
            if (req.session.searchParams) {
                delete req.session.searchParams;
            }

            return next();
        }

        const searchData = {
            exactMatch: isRegex ? false : isExactMatch,
            regex: isRegex,
            text,
            listID
        };

        req.session.searchParams = searchData;
        next();
    }
}

module.exports = Pagination;
