function restoreTheme() {
  const currentTheme = localStorage.getItem("bootstrap-theme");
  let restoredTheme = "dark";

  if (currentTheme === "light") {
    restoredTheme = "light";
  }

  document.body.setAttribute("data-bs-theme", restoredTheme);
  console.log("restoredTheme", restoredTheme);
}

(function () {
  restoreTheme();

  document.body.addEventListener("click", function (event) {
    console.log("before");
    console.log(event.target);
    if (event.target.id !== "bootstrap-change-light-dark-theme") return;
    console.log("after");

    let bootstrapTheme = document.body.getAttribute("data-bs-theme");
    if (bootstrapTheme === "dark") {
      bootstrapTheme = "light";
    } else {
      bootstrapTheme = "dark";
    }

    document.body.setAttribute("data-bs-theme", bootstrapTheme);
    localStorage.setItem("bootstrap-theme", bootstrapTheme);
  });
})();
