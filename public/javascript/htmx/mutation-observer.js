import { addListenerToMinMaxInput } from "./custom-columns.js";
import { addObserverToModalContentSection } from "./open-modal-when-mounted.js";
import { addObserverToRuntimeFlashSection } from "../flashContainerHeight.js";
import { restoreScrollPosition } from "./keep-scrolling-after-update.js";

function mutationObserver(mutationList, observer) {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      for (const element of mutation.addedNodes) {
        if (element.nodeType === 1) {
          addListenerToMinMaxInput(element);
          addObserverToModalContentSection(element);
          addObserverToRuntimeFlashSection(element);
          restoreScrollPosition(element);
        }
      }
    }
  }
}

(function () {
  const observer = new MutationObserver(mutationObserver);
  observer.observe(document.body, {
    attributes: false,
    childList: true,
    subtree: true,
  });
})();
