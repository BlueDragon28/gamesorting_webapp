export default function(email) {
    if (!email.trim().length) {
        return false;
    }

    const xhrRequest = new XMLHttpRequest();
    //xhrRequest.addEventListener("load", onRequestFinish);
    //xhrRequest.addEventListener("error", onRequestFinish);
    xhrRequest.open("POST", `/users/email?_method=PUT`);
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.send(JSON.stringify({
        email
    }));
}
