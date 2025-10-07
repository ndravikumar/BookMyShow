const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BookMyShow API",
      version: "1.0.0",
      description: "API documentation for BookMyShow backend",
    },
    servers: [
      {
        url: "http://localhost:5000", // change if needed
      },
    ],
  },
  apis: ["./routes/*.js"], // path to your route files
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
