function checkPassword(...passwords) {
    for (const password of passwords) {
        if (!password || typeof password !== "string" || !password.length) {
            return false;
        }
    }

    return true;
}

function whenProcessed(event) {
    const response = JSON.parse(event.target.response);

    if (response.type === "SUCCESS") {
        console.log("SUCCESS:", response.message);
    } else {
        console.error("ERROR:", response.message);
    }
} 

export default function(currentPassword, newPassword, retypedPassword) {
    if (!checkPassword(currentPassword, newPassword, retypedPassword) ||
        newPassword !== retypedPassword) {
        return false;
    }

    const xhrRequest = new XMLHttpRequest();
    xhrRequest.addEventListener("load", whenProcessed);
    xhrRequest.addEventListener("error", whenProcessed);
    xhrRequest.open("POST", "/users/password?_method=PUT");
    xhrRequest.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhrRequest.send(JSON.stringify({
        currentPassword,
        newPassword,
        retypedPassword
    }));

    return true;
}
