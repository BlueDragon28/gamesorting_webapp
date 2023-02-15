function whenProcessed(event) {
    console.log(event.target.response);
}

export default function(email) {
    if (!email.trim().length) {
        return false;
    }

    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", whenProcessed);
    xhrRequest.addEventListener("error", whenProcessed);
    xhrRequest.open("POST", `/users/email?_method=PUT`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.send(JSON.stringify({
        email
    }));
}
