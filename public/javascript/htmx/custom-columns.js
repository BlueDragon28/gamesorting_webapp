export function addListenerToMinMaxInput(element) {
    console.log("found modification in DOM");
    const selectInputBlock = element.hasAttribute("gm-custom-columns-select-type") ?
        element : 
        element.querySelector("[gm-custom-columns-select-type=\"true\"]");
    console.log(selectInputBlock);
    if (selectInputBlock) {
        const selectInput = selectInputBlock.querySelector("select");
        selectInput.addEventListener("change", function(event) {
            const minMaxBlock = selectInputBlock.nextElementSibling;
            if (event.target.value === "@Int") {
                minMaxBlock.classList.remove("d-none");
            } else {
                minMaxBlock.classList.add("d-none");
            }
        });
        selectInputBlock.removeAttribute("gm-custom-columns-select-type");
    }
}
