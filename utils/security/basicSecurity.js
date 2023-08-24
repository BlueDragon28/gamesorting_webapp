const helmet = require("helmet");

const styleSrcUrls = [
    "'self'",
    "'unsafe-inline'",
    "https://cdn.jsdelivr.net",
];

const scriptSrcUrls = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://cdn.jsdelivr.net"
]

const imgSrcUrls = [
    "'self'",
    "data:",
    "https://cdn.jsdelivr.net"
]

function configureHelmet(app) {
    app.use(helmet.contentSecurityPolicy({
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: scriptSrcUrls,
            styleSrc: styleSrcUrls,
            upgradeInsecureRequests: process.env.NODE_END === "production" ? [] : null,
            imgSrc: imgSrcUrls
        }
    }));
}

module.exports = {
    configureHelmet
};
