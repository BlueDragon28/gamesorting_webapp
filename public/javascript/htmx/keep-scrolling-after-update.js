const KEEP_SCROLL_ATTRIBUTE_NAME = "gs-keep-scroll";
const KEEP_SCROLL_RESTORED = "gs-keep-scroll-restored";

export function restoreScrollPosition(element) {
  // Check if the element or child element has the keep scroll attribute set
  const listGroupElements = element.hasAttribute(KEEP_SCROLL_ATTRIBUTE_NAME)
    ? element
    : element.querySelectorAll(
        `[${KEEP_SCROLL_ATTRIBUTE_NAME}]:not(.${KEEP_SCROLL_RESTORED})`,
      );

  listGroupElements.forEach((listGroupElement) => {
    if (
      listGroupElement &&
      !listGroupElement.classList.contains(KEEP_SCROLL_RESTORED)
    ) {
      // Get the scroll position base on the attribute value
      const scrollValue = listGroupElement.getAttribute(
        KEEP_SCROLL_ATTRIBUTE_NAME,
      );
      if (typeof scrollValue !== "string" || !scrollValue.length) return;

      const scrollPosition = parseInt(sessionStorage.getItem(scrollValue)) || 0;

      // restore scroll position
      listGroupElement.scrollTop = scrollPosition;

      // if scrollPosition not applied, set it with delay time.
      if (
        listGroupElement.scrollTop === 0 &&
        listGroupElement.scrollTop != scrollPosition
      ) {
        setTimeout(() => (listGroupElement.scrollTop = scrollPosition), 100);
      }

      // add attribute to indicate the the scroll has been restored
      listGroupElement.classList.add(KEEP_SCROLL_RESTORED);

      // Add event handler to save scroll position
      listGroupElement.addEventListener("scrollend", function (event) {
        const scrollValue = event.target.getAttribute(
          KEEP_SCROLL_ATTRIBUTE_NAME,
        );
        const scrollPosition = event.target.scrollTop;

        if (!scrollValue) return;

        sessionStorage.setItem(scrollValue, scrollPosition.toString());
      });
    }
  });
}
