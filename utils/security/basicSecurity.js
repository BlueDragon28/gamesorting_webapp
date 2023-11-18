const helmet = require("helmet");

const styleSrcUrls = [
    "'self'",
    "'unsafe-inline'",
];

const scriptSrcUrls = [
    "'self'",
    "'unsafe-inline'",
]

const imgSrcUrls = [
    "'self'",
    "data:",
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
