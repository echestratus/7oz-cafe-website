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
                $ref: "#/components/schemas/SuccessEnvelope"
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
                $ref: "#/components/schemas/SuccessEnvelope"
        "503":
          description: One or more dependencies are unhealthy
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /auth/register:
    post:
      summary: Register a customer account
      operationId: register
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/RegisterRequest"
      responses:
        "201":
          description: Account created; email verification required
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
        "409":
          description: Email already registered
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorEnvelope"
  /auth/verify-email:
    post:
      summary: Verify email address
      operationId: verifyEmail
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [token]
              properties:
                token:
                  type: string
      responses:
        "200":
          description: Email verified
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /auth/login:
    post:
      summary: Login with email and password
      operationId: login
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LoginRequest"
      responses:
        "200":
          description: Authenticated; sets refresh_token HttpOnly cookie
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
        "401":
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorEnvelope"
  /auth/refresh:
    post:
      summary: Rotate refresh session and issue new access token
      operationId: refresh
      tags: [Authentication]
      responses:
        "200":
          description: Tokens rotated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /auth/logout:
    post:
      summary: Revoke refresh session and clear cookie
      operationId: logout
      tags: [Authentication]
      responses:
        "200":
          description: Logged out
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /auth/me:
    get:
      summary: Current authenticated principal
      operationId: me
      tags: [Authentication]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Current user profile
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
        "401":
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorEnvelope"
  /auth/forgot-password:
    post:
      summary: Request password reset token
      operationId: forgotPassword
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email:
                  type: string
                  format: email
      responses:
        "200":
          description: Always succeeds to avoid account enumeration
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /auth/reset-password:
    post:
      summary: Reset password with token
      operationId: resetPassword
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [token, newPassword]
              properties:
                token:
                  type: string
                newPassword:
                  type: string
                  minLength: 8
      responses:
        "200":
          description: Password updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/cms/homepage:
    get:
      summary: Published homepage CMS snapshot
      operationId: getPublicHomepage
      tags: [CMS]
      responses:
        "200":
          description: Published homepage content
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/cms/about:
    get:
      summary: Published about CMS snapshot
      operationId: getPublicAbout
      tags: [CMS]
      responses:
        "200":
          description: Published about content
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/cms/footer:
    get:
      summary: Published footer CMS snapshot
      operationId: getPublicFooter
      tags: [CMS]
      responses:
        "200":
          description: Published footer content
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/cms/contact:
    get:
      summary: Published contact CMS snapshot
      operationId: getPublicContact
      tags: [CMS]
      responses:
        "200":
          description: Published contact content
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/cms/pages:
    get:
      summary: List CMS pages
      operationId: listCMSPages
      tags: [CMS]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: CMS pages
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/cms/pages/{slug}:
    get:
      summary: Get CMS page draft
      operationId: getCMSPageDraft
      tags: [CMS]
      security:
        - bearerAuth: []
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Draft page with sections
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/cms/pages/{slug}/publish:
    post:
      summary: Publish CMS page draft
      operationId: publishCMSPage
      tags: [CMS]
      security:
        - bearerAuth: []
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                summary:
                  type: string
      responses:
        "200":
          description: Published version created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/cms/pages/{slug}/rollback:
    post:
      summary: Rollback CMS page to a prior version and republish
      operationId: rollbackCMSPage
      tags: [CMS]
      security:
        - bearerAuth: []
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [versionNumber]
              properties:
                versionNumber:
                  type: integer
                summary:
                  type: string
      responses:
        "200":
          description: Page rolled back and republished
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/media:
    get:
      summary: List media assets
      operationId: listMedia
      tags: [Media]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Media assets
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    post:
      summary: Upload media asset
      operationId: uploadMedia
      tags: [Media]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file]
              properties:
                file:
                  type: string
                  format: binary
                altText:
                  type: string
      responses:
        "201":
          description: Media uploaded
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/reservations/availability:
    get:
      summary: Get reservation availability slots
      operationId: getReservationAvailability
      tags: [Reservations]
      parameters:
        - name: date
          in: query
          required: true
          schema:
            type: string
            format: date
        - name: guestCount
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            default: 2
      responses:
        "200":
          description: Availability slots for the selected date
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/reservations:
    post:
      summary: Create a guest reservation
      operationId: createPublicReservation
      tags: [Reservations]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateReservationRequest"
      responses:
        "201":
          description: Reservation created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
        "409":
          description: Slot unavailable or duplicate reservation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorEnvelope"
  /customer/reservations:
    get:
      summary: List authenticated customer reservations
      operationId: listCustomerReservations
      tags: [Reservations]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Customer reservations
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    post:
      summary: Create a reservation linked to the authenticated customer
      operationId: createCustomerReservation
      tags: [Reservations]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateReservationRequest"
      responses:
        "201":
          description: Reservation created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /customer/reservations/{id}:
    get:
      summary: Get a customer reservation
      operationId: getCustomerReservation
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Reservation details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    delete:
      summary: Cancel a customer reservation
      operationId: cancelCustomerReservation
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
      responses:
        "200":
          description: Reservation cancelled
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations:
    get:
      summary: List reservations for operations staff
      operationId: listAdminReservations
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: date
          in: query
          schema:
            type: string
            format: date
        - name: status
          in: query
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        "200":
          description: Paginated reservations
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/{id}:
    get:
      summary: Get reservation details
      operationId: getAdminReservation
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Reservation details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    patch:
      summary: Assign a table to a reservation
      operationId: assignReservationTable
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [tableId]
              properties:
                tableId:
                  type: string
                  format: uuid
      responses:
        "200":
          description: Table assigned
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/{id}/confirm:
    patch:
      summary: Confirm a reservation
      operationId: confirmReservation
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Reservation confirmed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/{id}/check-in:
    patch:
      summary: Check in a reservation
      operationId: checkInReservation
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Guest checked in
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/{id}/complete:
    patch:
      summary: Complete a reservation
      operationId: completeReservation
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Reservation completed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/{id}/cancel:
    patch:
      summary: Cancel a reservation
      operationId: cancelAdminReservation
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
      responses:
        "200":
          description: Reservation cancelled
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/{id}/no-show:
    patch:
      summary: Mark reservation as no-show
      operationId: markReservationNoShow
      tags: [Reservations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Reservation marked as no-show
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    SuccessEnvelope:
      type: object
      required: [success, message, data]
      properties:
        success:
          type: boolean
        message:
          type: string
        data:
          type: object
          additionalProperties: true
        meta:
          type: object
          additionalProperties: true
    ErrorEnvelope:
      type: object
      required: [success, message]
      properties:
        success:
          type: boolean
        message:
          type: string
        errors:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string
    RegisterRequest:
      type: object
      required: [email, password, full_name]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        full_name:
          type: string
    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
    CreateReservationRequest:
      type: object
      required: [fullName, email, phone, date, time, guestCount]
      properties:
        fullName:
          type: string
        email:
          type: string
          format: email
        phone:
          type: string
        date:
          type: string
          format: date
        time:
          type: string
          description: HH:MM in cafe timezone
        guestCount:
          type: integer
          minimum: 1
        notes:
          type: string
`
