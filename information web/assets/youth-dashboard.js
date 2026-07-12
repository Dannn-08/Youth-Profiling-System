const editBtn = document.getElementById("editProfileBtn");
const dialog = document.getElementById("profileDialog");


editBtn.addEventListener("click", () => {
  dialog.showModal();
});

document.getElementById("editProfileBtn")
  .addEventListener("click", () => {
    document.getElementById("profileDialog").showModal();
  });

dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    dialog.close();
  }
});