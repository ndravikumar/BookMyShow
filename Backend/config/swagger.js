const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerDef = require("./swagger.json");

const options = {
  definition: swaggerDef,
  apis: [], // Since we're using a JSON file instead of JSDoc comments
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
