class HtmxRequest {
    isHTMX;
    isBoosted;
    currentUrl;
    historyRestoreRequest;
    prompt;
    target;
    triggerName;
    triggerID;

    constructor(
        request,
        boosted,
        currentUrl,
        historyRestoreRequest,
        prompt,
        target,
        triggerName,
        triggerID
    ) {
        this.isHTMX =
            request === "true";
        this.isBoosted = this.isHTMX && boosted === "true";
        this.currentUrl = currentUrl;
        this.historyRestoreRequest = historyRestoreRequest;
        this.prompt = prompt;
        this.target = target;
        this.triggerName = triggerName;
        this.triggerID = triggerID;
    }

    generateLocals() {
        return {
            isHTMX: this.isHTMX,
            isBoosted: this.isBoosted
        };
    }
}

function checkIfHTMX(req, res, next) {
    req.htmx = new HtmxRequest(
        req.header("HX-Request"),
        req.header("HX-Boosted"),
        req.header("HX-Current-URL"),
        req.header("HX-History-Restore-Requeset"),
        req.header("HX-Prompt"),
        req.header("HX-Target"),
        req.header("HX-Trigger-Name"),
        req.header("HX-Trigger")
    );
    next();
}

function htmxRedirect(req, res, location) {
    if (req.htmx.isHTMX) {
        res.set({
            "HX-Location": `{"path":"${location}","headers":{"HX-Boosted":"true"}}`,
        }).send();
    } else {
        res.redirect(location);
    }
}

module.exports = {
    checkIfHTMX,
    htmxRedirect,
};
