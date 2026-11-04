const useJumpLinkComposable = () => {
  const setFocus = (element) => {
    element.setAttribute('tabindex', '-1');
    element.focus();
    element.removeAttribute('tabindex');
  };
  // Scrolls to the element of refs[refName] (same behaviour as scrollToOffset,
  // for callers that have no click event, e.g. the context menu)
  const scrollToRef = (refs, refName) => {
    const element = refs[refName].value.$el;
    // Set focus and tabindex on selected element
    setFocus(element);
    // Set scroll offset below header
    const offset = element.offsetTop - 50;
    window.scroll({
      top: offset,
      behavior: 'smooth',
    });
  };
  const scrollToOffset = (refs, event) => {
    // Select element to scroll to
    scrollToRef(refs, event.target.getAttribute('data-ref'));
  };
  const scrollToOffsetInventory = (refs, event, index) => {
    // Select element to scroll to
    const ref = event.target.getAttribute('data-ref');
    const element = refs[ref][index].$el;

    // Set focus and tabindex on selected element
    setFocus(element);

    // Set scroll offset below header
    const offset = element.offsetTop + 300;
    window.scroll({
      top: offset,
      behavior: 'smooth',
    });
  };
  return {
    setFocus,
    scrollToRef,
    scrollToOffset,
    scrollToOffsetInventory,
  };
};

export default useJumpLinkComposable;
