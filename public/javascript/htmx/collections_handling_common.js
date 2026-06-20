import htmx from "htmx.org";

const LIST_ITEMS_BLOCK_ID = "#collections-items-list-row";
const ITEM_BLOCK_ID = "#item-detail-card";

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

function load_list(
  listID,
  blockID = LIST_ITEMS_BLOCK_ID,
  searchTerm = "",
  pageNumber = null,
) {
  const listPageID = pageNumber ?? getListPage(listID);
  let headers = {
    "GS-currentItemsPage": listPageID,
    "GS-searchTerm": searchTerm,
  };

  htmx.ajax("GET", `/collections/lists/${listID}?onlyItems=true`, {
    target: blockID,
    swap: "outerHTML",
    push: true,
    headers,
  });
}

export {
  LIST_ITEMS_BLOCK_ID,
  ITEM_BLOCK_ID,
  getListPage,
  setListPage,
  load_list,
};
