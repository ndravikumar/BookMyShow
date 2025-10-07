const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerDef = require("./swagger.json");

const options = {
  definition: swaggerDef,
  apis: ["./routes/*.js"], // path to your route files
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
