const CUSTOM_COLUMN_ATT_NAME = "gs-new-custom-column-data";
const CUSTOM_COLUMN_BTN = "btn";
const CUSTOM_COLUMN_LIST = "list";

function addNewCustomField(selectedList) {
  selectedList.innerHTML += `
    <div>
      <input type="text" class="form-control form-control-sm border-bottom-0 rounded-top rounded-bottom-0 mt-2" placeholder="Name" />
      <input type="text" class="form-control border-top-0 rounded-top-0 rounded-bottom" placeholder="Value" />
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
    !selectList.getAttribute(CUSTOM_COLUMN_ATT_NAME) === CUSTOM_COLUMN_LIST
  ) {
    return;
  }

  selectBtn.addEventListener("click", (evt) => addNewCustomField(selectList));
}
