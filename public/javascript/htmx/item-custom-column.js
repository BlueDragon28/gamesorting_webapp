const CUSTOM_COLUMN_ATT_NAME = "gs-new-custom-column-data";
const CUSTOM_COLUMN_BTN = "btn";
const CUSTOM_COLUMN_LIST = "list";
const CUSTOM_COLUMN_DELETE = "delete";
const CUSTOM_COLUMN_BLOCK = "inputBlock";

document.body.addEventListener("click", function (evt) {
  if (
    !evt.target ||
    evt.target?.getAttribute(CUSTOM_COLUMN_ATT_NAME) !== CUSTOM_COLUMN_DELETE
  ) {
    return;
  }

  const parentBlock = evt.target?.parentElement?.parentElement;

  if (
    !parentBlock ||
    !parentBlock.getAttribute(CUSTOM_COLUMN_ATT_NAME) === CUSTOM_COLUMN_BLOCK
  ) {
    return;
  }

  parentBlock.parentElement?.removeChild(parentBlock);
});

function addNewCustomField(selectedList) {
  selectedList.innerHTML += `
    <div class="d-flex flex-row" ${CUSTOM_COLUMN_ATT_NAME}="${CUSTOM_COLUMN_BLOCK}">
      <div class="flex-fill">
        <input type="text" class="form-control form-control-sm border-bottom-0 rounded-top rounded-bottom-0 mt-2" placeholder="Name" />
        <input type="text" class="form-control border-top-0 rounded-top-0 rounded-bottom" placeholder="Value" />
      </div>
      <div class="d-flex flex-column justify-content-center">
        <button type="button" class="btn-close my-auto" ${CUSTOM_COLUMN_ATT_NAME}="${CUSTOM_COLUMN_DELETE}" />
      <div>
    </div>
  `;
}

export function addListenerItemCustomColumn(element) {
  const selectBtn =
    element.getAttribute(CUSTOM_COLUMN_ATT_NAME) === CUSTOM_COLUMN_BTN
      ? element
      : element.querySelector(
          `[${CUSTOM_COLUMN_ATT_NAME}="${CUSTOM_COLUMN_BTN}"]`
        );

  if (!selectBtn) return;

  const selectList = selectBtn.previousElementSibling;

  if (
    !selectList ||
    selectList.getAttribute(CUSTOM_COLUMN_ATT_NAME) !== CUSTOM_COLUMN_LIST
  ) {
    return;
  }

  selectBtn.addEventListener("click", (evt) => addNewCustomField(selectList));
}
