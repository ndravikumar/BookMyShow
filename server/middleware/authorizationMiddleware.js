const jwt = require("jsonwebtoken");

const validateJWTToken = (req, res, next) => {
    try {
        let token;
        if (req?.headers?.authorization) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies && req.cookies.tokenForBMS) {
            token = req.cookies.tokenForBMS;
        }
        if (!token) {
            return res.status(401).send({ success: false, message: "No token provided" });
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > decoded.exp) {
            return res.status(401).send({ success: false, message: "Expired Token" });
        }
        req.body.userId = decoded?.userId;
        next();
    } catch (error) {
        res.status(401).send({ success: false, message: "Invalid/Expired Token" })
    }
}

module.exports = {
    validateJWTToken
}