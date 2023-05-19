const messageInput = document.getElementById("message");
const numberOfCharactersSpan = document.getElementById("number-of-characters");

function displayNumberOfCharactersWrited() {
    const numberOfCharacters = messageInput.value.length;
    numberOfCharactersSpan.innerText = numberOfCharacters.toString();
}
displayNumberOfCharactersWrited();

messageInput.addEventListener("input", displayNumberOfCharactersWrited);