import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Corea Hoy API',
      version: '1.0.0',
      description: 'Corea Hoy 백엔드 API 문서',
    },
    servers: [
      {
        url: 'http://localhost:1234',
        description: '개발 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // 이 경로의 파일에서 JSDoc 주석을 읽어서 문서 생성
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
