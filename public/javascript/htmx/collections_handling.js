import htmx from "htmx.org";

const BUTTON_LIST_SRC_STR = "button-collection-list";
const BUTTON_LIST_ID_STARTSWITH = "button-list-";
const BUTTON_LIST_COLLECTION_CURRENT_PAGE_STARTSWITH =
  "button-collection-current-page-";
const BUTTON_GO_BACK_TO_LIST = "button-go-back-to-list";
const LIST_ITEMS_BLOCK_ID = "#collections-items-list-row";
const ITEM_BLOCK_ID = "#item-detail-card";

const BUTTON_ITEM_FROM_LIST_STR = "button-item-from-list";
const BUTTON_ITEM_FROM_LIST_STARTSWITH = "item-from-list-id-";
const GS_BASE_URL = "GS-base-url";

const PREVIOUS_BUTTON_LIST_PAGE = "button-previous-list-page";
const NEXT_BUTTON_LIST_PAGE = "button-next-list-page";
const GS_NUMBER_OF_PAGES = "GS-number-of-pages";
const GS_CURRENT_ID = "GS-current-id";

function getListPage(listID) {
  let currentPage = parseInt(
    sessionStorage.getItem(`collection-list-${listID}-page`),
  );
  if (!currentPage) {
    currentPage = 1;
  }
  return currentPage;
}

function setListPage(listID, pageNumber) {
  if (!listID || !pageNumber) return;
  sessionStorage.setItem(`collection-list-${listID}-page`, pageNumber);
}

function get_id_from_class(element, id_starts_with) {
  if (!element || !id_starts_with) return;

  let searched_id;

  for (let i = 0; i < element.classList.length; i++) {
    const class_element = element.classList.item(i);
    if (class_element.startsWith(id_starts_with)) {
      const class_element_with_id = class_element.replace(id_starts_with, "");
      searched_id = class_element_with_id;
      break;
    }
  }

  return searched_id;
}

function load_collection(targetCollectionID, page_id) {
  const id = targetCollectionID.replace("button-list-", "");
  const listPageID = getListPage(id);
  console.log("target id:", id);
  console.log("ready to replace");
  let headers = {};
  console.log("page_id:", page_id);
  if (page_id) {
    headers["GS-currentPage"] = page_id;
    headers["GS-currentItemsPage"] = listPageID;
  }
  htmx.ajax("GET", `/collections/lists/${id}`, {
    target: "#collections-lists-global-row",
    swap: "outerHTML",
    push: "true",
    headers,
  });
}

function load_list(listID, blockID = LIST_ITEMS_BLOCK_ID) {
  const listPageID = getListPage(listID);
  let headers = {
    "GS-currentItemsPage": listPageID,
  };

  htmx.ajax("GET", `/collections/lists/${listID}?onlyItems=true`, {
    target: blockID,
    swap: "outerHTML",
    push: true,
    headers,
  });
}

function load_item(targetItemID, baseUrl) {
  if (!targetItemID || !baseUrl) return;
  console.log("item: ", targetItemID);
  console.log("baseUrl", baseUrl);
  htmx.ajax("GET", `${baseUrl}/item/${targetItemID}`, {
    target: LIST_ITEMS_BLOCK_ID,
    swap: "outerHTML",
    push: "true",
    headers: {
      "GS-currentItemsPage": "0",
      "GS-searchTerm": "",
    },
  });
}

function load_next_item_page(listID, pageNumber) {
  if (!listID || !pageNumber) return;

  console.log("pageNumber", pageNumber);

  htmx.ajax("GET", `/collections/lists/${listID}?onlyItems=true`, {
    target: LIST_ITEMS_BLOCK_ID,
    swap: "outerHTML",
    headers: {
      "GS-currentItemsPage": pageNumber,
      "GS-searchTerm": "",
    },
  });
}

function handling_open_list(element) {
  let item_id = element.id;
  let page_id;

  if (!item_id.startsWith(BUTTON_LIST_ID_STARTSWITH)) item_id = null;

  if (!item_id) {
    element = element.closest(`.${BUTTON_LIST_SRC_STR}`);
    if (!element) return false;
    item_id = get_id_from_class(element, BUTTON_LIST_ID_STARTSWITH);
    if (!item_id) return false;
  }

  page_id = get_id_from_class(
    element,
    BUTTON_LIST_COLLECTION_CURRENT_PAGE_STARTSWITH,
  );

  load_collection(item_id, page_id);

  return true;
}

function handling_next_list(element) {
  let item_id = element.id;
  if (item_id !== NEXT_BUTTON_LIST_PAGE) return false;

  const listID = element.getAttribute(GS_CURRENT_ID);
  let numberOfPages = parseInt(element.getAttribute(GS_NUMBER_OF_PAGES)) ?? 1;
  if (!listID) return false;

  let currentPage = parseInt(getListPage(listID)) ?? 1;
  currentPage += 1;
  if (currentPage > numberOfPages) {
    currentPage = 1;
  }
  setListPage(listID, currentPage);
  load_next_item_page(listID, currentPage);

  return true;
}

function handling_previous_list(element) {
  let item_id = element.id;
  if (item_id !== PREVIOUS_BUTTON_LIST_PAGE) return false;

  const listID = element.getAttribute(GS_CURRENT_ID);
  const numberOfPages = element.getAttribute(GS_NUMBER_OF_PAGES);
  if (!listID) return false;

  let currentPage = getListPage(listID);
  if (!currentPage || currentPage <= 1) {
    return false;
  }
  currentPage -= 1;
  if (typeof numberOfPages === "number" && currentPage > numberOfPages) {
    currentPage = 1;
  }
  setListPage(listID, currentPage);
  load_next_item_page(listID, currentPage);

  console.log("end");

  return true;
}

function handling_open_item(element) {
  console.log("item1:", element);
  if (element.id !== BUTTON_ITEM_FROM_LIST_STR) {
    element = element.closest(`#${BUTTON_ITEM_FROM_LIST_STR}`);
    console.log("item2:", element);
    if (!element) return false;
  }
  let item_id = get_id_from_class(element, BUTTON_ITEM_FROM_LIST_STARTSWITH);
  console.log("item_id:", item_id);
  if (!item_id) return false;
  let baseUrl = element.getAttribute(GS_BASE_URL);
  console.log("baseUrl:", baseUrl);
  if (!baseUrl) return false;

  console.log("handling open_item");

  load_item(item_id, baseUrl);

  return true;
}

function handling_go_back_to_list(element) {
  if (!element.classList.contains(BUTTON_GO_BACK_TO_LIST)) return false;

  const list_id = element.getAttribute(GS_CURRENT_ID);
  if (typeof list_id !== "string" || list_id.length === 0) return false;

  const isItem = !element.classList.contains("not-from-item-go-back");
  load_list(list_id, isItem ? ITEM_BLOCK_ID : LIST_ITEMS_BLOCK_ID);

  return true;
}

document.body.addEventListener("click", function (event) {
  if (event.target) {
    handling_open_list(event.target) ||
      handling_open_item(event.target) ||
      handling_next_list(event.target) ||
      handling_previous_list(event.target) ||
      handling_go_back_to_list(event.target);
  }

  console.log("test");
});
