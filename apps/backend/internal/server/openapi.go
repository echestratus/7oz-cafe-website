package server

const openAPISpec = `openapi: 3.1.0
info:
  title: 7Oz Espresso Cafe API
  version: 1.0.0
  description: REST API for the 7Oz Espresso Cafe Digital Platform.
servers:
  - url: /api/v1
    description: Versioned API
paths:
  /health:
    get:
      summary: Liveness probe
      operationId: getHealthLive
      tags: [Health]
      responses:
        "200":
          description: Service is alive
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthResponse"
  /health/ready:
    get:
      summary: Readiness probe
      operationId: getHealthReady
      tags: [Health]
      responses:
        "200":
          description: Service dependencies are healthy
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthResponse"
        "503":
          description: One or more dependencies are unhealthy
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthResponse"
components:
  schemas:
    HealthResponse:
      type: object
      required: [success, message, data]
      properties:
        success:
          type: boolean
        message:
          type: string
        data:
          $ref: "#/components/schemas/HealthReport"
    HealthReport:
      type: object
      required: [status, service, timestamp, dependencies]
      properties:
        status:
          type: string
          enum: [healthy, unhealthy]
        service:
          type: string
        timestamp:
          type: string
          format: date-time
        dependencies:
          type: object
          additionalProperties:
            type: string
            enum: [healthy, unhealthy, skipped]
`
