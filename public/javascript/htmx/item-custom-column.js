import { v4 as uuidv4 } from "uuid";

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
  const rowUUID = uuidv4();

  selectedList.innerHTML += `
    <div class="d-flex flex-row my-3" ${CUSTOM_COLUMN_ATT_NAME}="${CUSTOM_COLUMN_BLOCK}">
      <div class="flex-fill">
        <input type="text" class="form-control form-control-sm border-bottom-0 rounded-top rounded-bottom-0" placeholder="Name" name="custom-col-${rowUUID}[name]" />
        <input type="text" class="form-control border-top-0 rounded-top-0 rounded-bottom" placeholder="Value" name="custom-col-${rowUUID}[value]" />
      </div>
      <div class="d-flex flex-column justify-content-center">
        <button type="button" class="btn-close my-auto" ${CUSTOM_COLUMN_ATT_NAME}="${CUSTOM_COLUMN_DELETE}" />
      </div>
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

  if (!selectBtn || selectBtn.classList.contains("is-watched")) return;
  selectBtn.classList.add("is-watched");

  const selectList = selectBtn.previousElementSibling;

  if (
    !selectList ||
    selectList.classList.contains("is-watched") ||
    selectList.getAttribute(CUSTOM_COLUMN_ATT_NAME) !== CUSTOM_COLUMN_LIST
  ) {
    return;
  }

  selectList.classList.add("is-watched");
  selectBtn.addEventListener("click", (evt) => addNewCustomField(selectList));
}
