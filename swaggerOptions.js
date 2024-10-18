// swaggerOptions.js

const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0', // OpenAPI version
    info: {
      title: 'Admin Coin Api', // Your API title
      version: '1.0.0', // Your API version
      description: 'API documentation for Admin Coin', // Description
    },
    servers: [
      {
        url: 'https://www.projectzerotwofour.cloudns.ch', // Server URL
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

module.exports = swaggerJsDoc(swaggerOptions);
