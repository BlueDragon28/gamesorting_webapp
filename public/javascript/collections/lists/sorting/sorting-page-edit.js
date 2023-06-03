let currentSelection = "no-order";
let orderDirection = "no-direction";

let noSortingButton;
let sortingByNameButton;
let sortingByRatingButton;

let noOrderBlock;
let simpleOrderBlock;

let ascendingButton;
let descendingButton;

function resetChoice() {
    ascendingButton.classList.remove("active");
    descendingButton.classList.remove("active");
    orderDirection = "no-direction";
}

function activeBlock(blockType) {
    if (blockType === "no-order") {
        noOrderBlock.classList.remove("d-none");
    } else {
        noOrderBlock.classList.add("d-none");
        console.log("oups");
    }

    if (blockType === "simple-order-block") {
        simpleOrderBlock.classList.remove("d-none");
    } else {
        simpleOrderBlock.classList.add("d-none");
    }
}

function activeButton(selection) {
    if (selection === "no-order") {
        noSortingButton.classList.add("active");
    } else {
        noSortingButton.classList.remove("active");
    }

    if (selection === "sorting-name") {
        sortingByNameButton.classList.add("active");
    } else {
        sortingByNameButton.classList.remove("active");
    }

    if (selection === "sorting-rating") {
        sortingByRatingButton.classList.add("active");
    } else {
        sortingByRatingButton.classList.remove("active");
    }
}

function selectNoOrder() {
    if (currentSelection === "no-order") {
        return;
    }

    activeBlock("no-order");
    activeButton("no-order");
    resetChoice();

    currentSelection = "no-order";
}

function selectOrderByName() {
    if (currentSelection === "order-by-name") {
        return;
    }

    activeBlock("simple-order-block");
    activeButton("sorting-name");
    resetChoice();

    currentSelection = "order-by-name";
}

function selectOrderByRating() {
    if (currentSelection === "order-by-rating") {
        return;
    }

    activeBlock("simple-order-block");
    activeButton("sorting-rating");
    resetChoice();

    currentSelection = "order-by-rating";
}

function selectAcendingOrder(order) {
    if (order === "ascending-order") {
        ascendingButton.classList.add("active");
        descendingButton.classList.remove("active");
    } else {
        ascendingButton.classList.remove("active");
        descendingButton.classList.add("active");
    }
}

(function() {
    noSortingButton = document.getElementById("no-sorting-button");
    sortingByNameButton = document.getElementById("sorting-by-name-button");
    sortingByRatingButton = document.getElementById("sorting-by-rating-button");

    noOrderBlock = document.getElementById("no-order-block");
    simpleOrderBlock = document.getElementById("simple-order-block");

    ascendingButton = document.getElementById("ascending-button-choice");
    descendingButton = document.getElementById("descending-button-choice");

    if (!noSortingButton || !sortingByNameButton || !sortingByRatingButton ||
        !noOrderBlock || !simpleOrderBlock || !ascendingButton || !descendingButton) {
        return;
    }

    noSortingButton.addEventListener("click", selectNoOrder);
    sortingByNameButton.addEventListener("click", selectOrderByName);
    sortingByRatingButton.addEventListener("click", selectOrderByRating);

    ascendingButton.addEventListener("click", () => selectAcendingOrder("ascending-order"));
    descendingButton.addEventListener("click", () => selectAcendingOrder("descending-order"));
})();
