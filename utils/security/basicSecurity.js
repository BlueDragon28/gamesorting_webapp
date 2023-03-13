const helmet = require("helmet");

const styleSrcUrls = [
    "'self'",
    "https://cdn.jsdelivr.net",
];

const scriptSrcUrls = [
    "'self'",
    "'unsafe-inline'",
    "https://cdn.jsdelivr.net"
]

function configureHelmet(app) {
    app.use(helmet()); // Add some layer of security

    app.use(helmet.contentSecurityPolicy({
        directives: {
            scriptSrc: scriptSrcUrls,
            styleSrc: styleSrcUrls
        }
    }));
}

module.exports = {
    configureHelmet
};
