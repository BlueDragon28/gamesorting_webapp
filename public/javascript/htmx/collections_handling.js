import htmx from "htmx.org";

const BUTTON_LIST_SRC_STR = "button-collection-list";
const BUTTON_LIST_ID_STARTSWITH = "button-list-";
const BUTTON_LIST_COLLECTION_CURRENT_PAGE_STARTSWITH =
  "button-collection-current-page-";

function get_id_from_class(element, id_starts_with) {
  if (!element || !id_starts_with) return;

  let searched_id;

  for (let i = 0; i < element.classList.length; i++) {
    const class_element = element.classList.item(i);
    if (class_element.startsWith(BUTTON_LIST_ID_STARTSWITH)) {
      class_element.replace(BUTTON_LIST_ID_STARTSWITH, "");
      searched_id = class_element;
    }
  }

  return searched_id;
}

function load_collection(targetCollectionID, page_id) {
  const id = targetCollectionID.replace("button-list-", "");
  console.log("target id:", id);
  console.log("ready to replace");
  let headers = {};
  if (page_id) {
    headers["GS-currentPage"] = `page_id`;
  }
  htmx.ajax("GET", `/collections/lists/${id}`, {
    target: "#collections-lists-global-row",
    swap: "outerHTML",
    push: true,
    headers,
  });
}

document.body.addEventListener("click", function (event) {
  if (event.target && event.target.classList.contains(BUTTON_LIST_SRC_STR)) {
    let element = event.target;
    let item_id = element.id;
    let page_id;
    if (!item_id) {
      element = event.target.closest(`.${BUTTON_LIST_SRC_STR}`);
      if (!element) return;
      item_id = get_id_from_class(element, BUTTON_LIST_ID_STARTSWITH);
      if (!item_id) return;
    }
    page_id = get_id_from_class(
      element,
      BUTTON_LIST_COLLECTION_CURRENT_PAGE_STARTSWITH,
    );

    load_collection(item_id, page_id);
  }
  console.log("test");
});
