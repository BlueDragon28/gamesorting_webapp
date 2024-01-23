const KEEP_SCROLL_ATTRIBUTE_NAME = "gs-keep-scroll";
const KEEP_SCROLL_RESTORED = "gs-keep-scroll-restored";

export function restoreScrollPosition(element) {
  // Check if the element or child element has the keep scroll attribute set
  const listGroupElement = element.hasAttribute(KEEP_SCROLL_ATTRIBUTE_NAME)
    ? element
    : element.querySelector(
        `[${KEEP_SCROLL_ATTRIBUTE_NAME}]:not([${KEEP_SCROLL_RESTORED}="true"]`,
      );

  if (
    listGroupElement &&
    !listGroupElement.hasAttribute(KEEP_SCROLL_RESTORED)
  ) {
    // Get the scroll position base on the attribute value
    const scrollValue = listGroupElement.getAttribute(
      KEEP_SCROLL_ATTRIBUTE_NAME,
    );
    if (typeof scrollValue !== "string" || !scrollValue.length) return;

    const scrollPosition = sessionStorage.getItem(scrollValue);

    // restore scroll position
    listGroupElement.scrollTop = parseInt(scrollPosition) || 0;

    // add attribute to indicate the the scroll has been restored
    listGroupElement.setAttribute(KEEP_SCROLL_RESTORED, "true");

    // Add event handler to save scroll position
    listGroupElement.addEventListener("scrollend", function (event) {
      const scrollValue = event.target.getAttribute(KEEP_SCROLL_ATTRIBUTE_NAME);
      const scrollPosition = event.target.scrollTop;

      if (!scrollValue) return;

      sessionStorage.setItem(scrollValue, scrollPosition.toString());
    });
  }
}
