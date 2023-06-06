import { makeAlertCard } from "../../../runtimeFlash/runtimeFlashHandler.js";

let currentSelection = "no-order";

let noSortingButton;
let sortingByNameButton;
let sortingByRatingButton;

let noOrderBlock;
let byNameBlock;
let byRatingBlock

let submitButton;

function activeBlock(blockType) {
    if (blockType === "no-order") {
        noOrderBlock.classList.remove("d-none");
    } else {
        noOrderBlock.classList.add("d-none");
    }

    if (blockType === "by-name") {
        byNameBlock.classList.remove("d-none");
    } else {
        byNameBlock.classList.add("d-none");
    }

    if (blockType === "by-rating") {
        byRatingBlock.classList.remove("d-none");
    } else {
        byRatingBlock.classList.add("d-none");
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

    currentSelection = "no-order";
}

function selectOrderByName() {
    if (currentSelection === "order-by-name") {
        return;
    }

    activeBlock("by-name");
    activeButton("sorting-name");

    currentSelection = "order-by-name";
}

function selectOrderByRating() {
    if (currentSelection === "order-by-rating") {
        return;
    }

    activeBlock("by-rating");
    activeButton("sorting-rating");

    currentSelection = "order-by-rating";
}

function onFinished(event) {
    const response = JSON.parse(event.target.response);

    if (response.type === "SUCCESS") {
        window.location = `/collections/${list.parentCollection.id}/lists/${list.id}`;
    } else {
        makeAlertCard("error", response.message);
    }
}

function submitChange() {
    const data = {
        type: "sorting",
        setTo: currentSelection
    };

    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", onFinished);
    xhrRequest.addEventListener("error", onFinished);
    xhrRequest.open("POST", `/collections/${list.parentCollection.id}/lists/${list.id}/sorting-options`)
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf8");
    xhrRequest.setRequestHeader("Accept", "application/json");
    xhrRequest.send(JSON.stringify(data));
}

function restoreSelection() {
    const storedSelection = listSorting.type;

    if (storedSelection === "no-order") {
        return;
    } else if (storedSelection === "order-by-name") {
        selectOrderByName();
    } else if (storedSelection === "order-by-rating") {
        selectOrderByRating();
    }
}

(function() {
    noSortingButton = document.getElementById("no-sorting-button");
    sortingByNameButton = document.getElementById("sorting-by-name-button");
    sortingByRatingButton = document.getElementById("sorting-by-rating-button");
    submitButton = document.getElementById("submit-order-change");

    noOrderBlock = document.getElementById("no-order-block");
    byNameBlock = document.getElementById("by-name-ordering-block");
    byRatingBlock = document.getElementById("by-rating-ordering-block");

    if (!noSortingButton || !sortingByNameButton || !sortingByRatingButton ||
        !submitButton || !noOrderBlock || !byNameBlock || !byRatingBlock) {
        return;
    }

    restoreSelection();

    noSortingButton.addEventListener("click", selectNoOrder);
    sortingByNameButton.addEventListener("click", selectOrderByName);
    sortingByRatingButton.addEventListener("click", selectOrderByRating);
    submitButton.addEventListener("click", submitChange);
})();
