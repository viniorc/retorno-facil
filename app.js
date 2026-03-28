const emptyState = document.querySelector("#empty-state");

if (emptyState) {
  window.setTimeout(() => {
    emptyState.classList.add("is-hidden");
  }, 4000);
}
