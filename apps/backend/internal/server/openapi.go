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
  /public/contact:
    post:
      summary: Submit a public contact message
      operationId: createPublicContactMessage
      tags: [Contact]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateContactMessageRequest"
      responses:
        "201":
          description: Contact message accepted
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
        "422":
          description: Validation failed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorEnvelope"
        "429":
          description: Rate limit exceeded
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorEnvelope"
  /admin/contact-messages:
    get:
      summary: List contact messages
      operationId: listAdminContactMessages
      tags: [Contact]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
        - name: status
          in: query
          schema:
            type: string
            enum: [new, read, archived]
        - name: search
          in: query
          schema:
            type: string
      responses:
        "200":
          description: Paginated contact messages
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/contact-messages/{id}:
    get:
      summary: Get a contact message
      operationId: getAdminContactMessage
      tags: [Contact]
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
          description: Contact message details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/contact-messages/{id}/status:
    patch:
      summary: Update contact message status
      operationId: updateAdminContactMessageStatus
      tags: [Contact]
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
              $ref: "#/components/schemas/UpdateContactMessageStatusRequest"
      responses:
        "200":
          description: Contact message status updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
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
    post:
      summary: Create a walk-in or phone reservation
      operationId: createAdminReservation
      tags: [Reservations]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/AdminCreateReservationRequest"
      responses:
        "201":
          description: Reservation created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/settings:
    get:
      summary: Get reservation booking settings
      operationId: getAdminReservationSettings
      tags: [Reservations]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Reservation settings
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    patch:
      summary: Update reservation booking settings
      operationId: updateAdminReservationSettings
      tags: [Reservations]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - minGuests
                - maxGuests
                - minAdvanceMinutes
                - maxAdvanceDays
                - slotIntervalMinutes
                - durationMinutes
                - bufferMinutes
                - cancelCutoffMinutes
                - timezone
                - weeklyHours
              properties:
                minGuests:
                  type: integer
                  minimum: 1
                maxGuests:
                  type: integer
                  minimum: 1
                minAdvanceMinutes:
                  type: integer
                  minimum: 0
                maxAdvanceDays:
                  type: integer
                  minimum: 1
                slotIntervalMinutes:
                  type: integer
                  minimum: 5
                durationMinutes:
                  type: integer
                  minimum: 15
                bufferMinutes:
                  type: integer
                  minimum: 0
                cancelCutoffMinutes:
                  type: integer
                  minimum: 0
                timezone:
                  type: string
                  example: Asia/Tashkent
                weeklyHours:
                  type: object
                  additionalProperties:
                    type: object
                    required: [open, close]
                    properties:
                      open:
                        type: string
                        example: "08:00"
                      close:
                        type: string
                        example: "00:00"
      responses:
        "200":
          description: Reservation settings updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/tables:
    get:
      summary: List cafe tables for operations staff
      operationId: listAdminCafeTables
      tags: [Reservations]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Cafe tables (active and inactive, excluding soft-deleted)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    post:
      summary: Create a cafe table
      operationId: createAdminCafeTable
      tags: [Reservations]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CafeTableRequest"
      responses:
        "201":
          description: Cafe table created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/tables/{id}:
    patch:
      summary: Update a cafe table
      operationId: updateAdminCafeTable
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
              $ref: "#/components/schemas/CafeTableRequest"
      responses:
        "200":
          description: Cafe table updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    delete:
      summary: Soft-delete a cafe table
      operationId: deleteAdminCafeTable
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
          description: Cafe table deleted
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/holidays:
    get:
      summary: List reservation closed days (holidays)
      operationId: listAdminReservationHolidays
      tags: [Reservations]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Closed days
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    post:
      summary: Create a closed day
      operationId: createAdminReservationHoliday
      tags: [Reservations]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ClosedDayRequest"
      responses:
        "201":
          description: Closed day created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/reservations/holidays/{id}:
    patch:
      summary: Update a closed day
      operationId: updateAdminReservationHoliday
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
              $ref: "#/components/schemas/ClosedDayRequest"
      responses:
        "200":
          description: Closed day updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    delete:
      summary: Delete a closed day
      operationId: deleteAdminReservationHoliday
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
          description: Closed day deleted
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
  /public/membership/levels:
    get:
      summary: List public membership levels
      operationId: listPublicMembershipLevels
      tags: [Membership]
      responses:
        "200":
          description: Membership levels
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/membership/benefits:
    get:
      summary: List public membership benefits
      operationId: listPublicMembershipBenefits
      tags: [Membership]
      responses:
        "200":
          description: Membership benefits
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /customer/membership:
    get:
      summary: Get authenticated customer membership
      operationId: getCustomerMembership
      tags: [Membership]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Membership profile with progress
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /customer/membership/benefits:
    get:
      summary: Get benefits for the customer membership level
      operationId: getCustomerMembershipBenefits
      tags: [Membership]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Membership benefits
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /customer/membership/history:
    get:
      summary: Get customer membership history
      operationId: getCustomerMembershipHistory
      tags: [Membership]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Membership history
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/memberships:
    get:
      summary: List memberships
      operationId: listAdminMemberships
      tags: [Membership]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Paginated memberships
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/customers:
    get:
      summary: List customers
      operationId: listAdminCustomers
      tags: [Customers]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
        - name: status
          in: query
          schema:
            type: string
        - name: search
          in: query
          schema:
            type: string
      responses:
        "200":
          description: Paginated customers
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/customers/{id}:
    get:
      summary: Get customer details
      operationId: getAdminCustomer
      tags: [Customers]
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
          description: Customer details with membership and loyalty summaries
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/customers/{id}/status:
    patch:
      summary: Update customer account status
      operationId: updateAdminCustomerStatus
      tags: [Customers]
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
              required: [status]
              properties:
                status:
                  type: string
                  enum: [active, suspended, inactive]
                reason:
                  type: string
      responses:
        "200":
          description: Customer status updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/users:
    get:
      summary: List staff users
      operationId: listAdminUsers
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
        - name: status
          in: query
          schema:
            type: string
        - name: role
          in: query
          schema:
            type: string
            enum: [admin, super_admin]
        - name: search
          in: query
          schema:
            type: string
      responses:
        "200":
          description: Paginated staff users
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    post:
      summary: Create staff user
      operationId: createAdminUser
      tags: [Users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, fullName, password, roleCode]
              properties:
                email:
                  type: string
                  format: email
                fullName:
                  type: string
                password:
                  type: string
                roleCode:
                  type: string
                  enum: [admin, super_admin]
      responses:
        "201":
          description: Staff user created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/users/{id}:
    get:
      summary: Get staff user details
      operationId: getAdminUser
      tags: [Users]
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
          description: Staff user details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/users/{id}/status:
    patch:
      summary: Update staff account status
      operationId: updateAdminUserStatus
      tags: [Users]
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
              required: [status]
              properties:
                status:
                  type: string
                  enum: [active, suspended, inactive]
                reason:
                  type: string
      responses:
        "200":
          description: Staff status updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/users/{id}/role:
    put:
      summary: Update staff role
      operationId: updateAdminUserRole
      tags: [Users]
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
              required: [roleCode]
              properties:
                roleCode:
                  type: string
                  enum: [admin, super_admin]
      responses:
        "200":
          description: Staff role updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/roles:
    get:
      summary: List assignable staff roles
      operationId: listAdminRoles
      tags: [Users]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Admin and super_admin roles
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/memberships/{id}:
    get:
      summary: Get membership details
      operationId: getAdminMembership
      tags: [Membership]
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
          description: Membership details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    patch:
      summary: Manually change membership level (super admin)
      operationId: updateAdminMembershipLevel
      tags: [Membership]
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
              required: [levelId]
              properties:
                levelId:
                  type: string
                  format: uuid
                reason:
                  type: string
      responses:
        "200":
          description: Membership level updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/memberships/{id}/status:
    patch:
      summary: Update membership status
      operationId: updateAdminMembershipStatus
      tags: [Membership]
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
              required: [status]
              properties:
                status:
                  type: string
                  enum: [active, inactive, suspended, expired]
                reason:
                  type: string
      responses:
        "200":
          description: Membership status updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/memberships/{id}/history:
    get:
      summary: Get membership upgrade and status history
      operationId: getAdminMembershipHistory
      tags: [Membership]
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
          description: Membership history
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/membership-levels:
    get:
      summary: List membership levels
      operationId: listAdminMembershipLevels
      tags: [Membership]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Membership levels
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/membership-levels/{id}:
    patch:
      summary: Update membership level rules
      operationId: updateAdminMembershipLevelRules
      tags: [Membership]
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
              required: [qualificationRules]
              properties:
                qualificationRules:
                  type: object
                  properties:
                    minCompletedReservations:
                      type: integer
                    minLifetimeLoyaltyPoints:
                      type: integer
                description:
                  type: string
                isActive:
                  type: boolean
      responses:
        "200":
          description: Membership level updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/loyalty/rewards:
    get:
      summary: List public loyalty rewards
      operationId: listPublicLoyaltyRewards
      tags: [Loyalty]
      responses:
        "200":
          description: Active rewards catalog
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /customer/loyalty:
    get:
      summary: Get customer loyalty balance
      operationId: getCustomerLoyalty
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Loyalty account
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /customer/loyalty/history:
    get:
      summary: Get customer loyalty history
      operationId: getCustomerLoyaltyHistory
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Loyalty transactions
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /customer/loyalty/rewards:
    get:
      summary: List redeemable rewards
      operationId: getCustomerLoyaltyRewards
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Rewards catalog
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /customer/loyalty/redeem:
    post:
      summary: Redeem a loyalty reward
      operationId: redeemLoyaltyReward
      tags: [Loyalty]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [rewardId]
              properties:
                rewardId:
                  type: string
                  format: uuid
      responses:
        "201":
          description: Reward redeemed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty:
    get:
      summary: List loyalty accounts
      operationId: listAdminLoyaltyAccounts
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Loyalty accounts
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty/settings:
    get:
      summary: Get loyalty program settings
      operationId: getAdminLoyaltySettings
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Loyalty settings
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    patch:
      summary: Update loyalty program settings
      operationId: updateAdminLoyaltySettings
      tags: [Loyalty]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [pointsPerCompletedReservation, expirationStrategy, expirationMonths]
              properties:
                pointsPerCompletedReservation:
                  type: integer
                  minimum: 0
                expirationStrategy:
                  type: string
                  enum: [never, rolling_months]
                expirationMonths:
                  type: integer
                  minimum: 1
      responses:
        "200":
          description: Loyalty settings updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty/history:
    get:
      summary: List loyalty transactions
      operationId: listAdminLoyaltyHistory
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Loyalty transactions
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty/adjustments:
    post:
      summary: Apply a manual loyalty adjustment
      operationId: createLoyaltyAdjustment
      tags: [Loyalty]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [userId, points, reason]
              properties:
                userId:
                  type: string
                  format: uuid
                points:
                  type: integer
                reason:
                  type: string
      responses:
        "200":
          description: Adjustment applied
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty/desk/lookup:
    get:
      summary: Lookup a customer for the staff redemption desk
      operationId: lookupLoyaltyDeskCustomer
      tags: [Loyalty]
      security:
        - bearerAuth: []
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
          description: Email, membership number, or 7oz-member QR payload
      responses:
        "200":
          description: Customer loyalty desk profile
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty/redeem:
    post:
      summary: Redeem a reward for a customer at the staff desk
      operationId: createAdminLoyaltyRedemption
      tags: [Loyalty]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [rewardId]
              properties:
                rewardId:
                  type: string
                  format: uuid
                userId:
                  type: string
                  format: uuid
                membershipNumber:
                  type: string
                email:
                  type: string
                  format: email
                qrPayload:
                  type: string
      responses:
        "201":
          description: Reward redeemed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty/campaigns:
    get:
      summary: List loyalty campaigns
      operationId: listLoyaltyCampaigns
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Campaigns
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    post:
      summary: Create a loyalty campaign
      operationId: createLoyaltyCampaign
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "201":
          description: Campaign created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty/campaigns/{id}:
    patch:
      summary: Update a loyalty campaign
      operationId: updateLoyaltyCampaign
      tags: [Loyalty]
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
          description: Campaign updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty/rewards:
    get:
      summary: List loyalty rewards
      operationId: listLoyaltyRewardsAdmin
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Rewards
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    post:
      summary: Create a loyalty reward
      operationId: createLoyaltyReward
      tags: [Loyalty]
      security:
        - bearerAuth: []
      responses:
        "201":
          description: Reward created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/loyalty/rewards/{id}:
    patch:
      summary: Update a loyalty reward
      operationId: updateLoyaltyReward
      tags: [Loyalty]
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
          description: Reward updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    delete:
      summary: Soft-delete a loyalty reward
      operationId: deleteLoyaltyReward
      tags: [Loyalty]
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
          description: Reward deleted
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/gallery:
    get:
      summary: List visible gallery items for a location
      operationId: listPublicGallery
      tags: [Gallery]
      parameters:
        - name: locationSlug
          in: query
          required: true
          schema:
            type: string
            example: city-park
      responses:
        "200":
          description: Visible gallery items
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/gallery:
    get:
      summary: List gallery items for admin
      operationId: listAdminGallery
      tags: [Gallery]
      security:
        - bearerAuth: []
      parameters:
        - name: locationSlug
          in: query
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        "200":
          description: Gallery items
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    post:
      summary: Create a gallery item
      operationId: createGalleryItem
      tags: [Gallery]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [imageUrl, locationSlug]
              properties:
                imageUrl:
                  type: string
                mediaId:
                  type: string
                  format: uuid
                  nullable: true
                locationSlug:
                  type: string
                category:
                  type: string
                  enum: [atmosphere, interior, exterior, coffee, food, events]
                altText:
                  type: string
                caption:
                  type: string
                sortOrder:
                  type: integer
                isVisible:
                  type: boolean
      responses:
        "201":
          description: Gallery item created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/gallery/{id}:
    get:
      summary: Get gallery item by id
      operationId: getAdminGalleryItem
      tags: [Gallery]
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
          description: Gallery item
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    patch:
      summary: Update a gallery item
      operationId: updateGalleryItem
      tags: [Gallery]
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
          description: Gallery item updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    delete:
      summary: Soft-delete a gallery item
      operationId: deleteGalleryItem
      tags: [Gallery]
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
          description: Gallery item deleted
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/blogs:
    get:
      summary: List published blog posts
      operationId: listPublicBlogs
      tags: [Blogs]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 12
      responses:
        "200":
          description: Published blog posts
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /public/blogs/{slug}:
    get:
      summary: Get a published blog post by slug
      operationId: getPublicBlogBySlug
      tags: [Blogs]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Blog post detail
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
        "404":
          description: Blog post not found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorEnvelope"
  /admin/blogs:
    get:
      summary: List blog posts for admin
      operationId: listAdminBlogs
      tags: [Blogs]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, published, archived]
        - name: kind
          in: query
          schema:
            type: string
            enum: [news, event]
        - name: search
          in: query
          schema:
            type: string
      responses:
        "200":
          description: Blog posts
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    post:
      summary: Create a blog post
      operationId: createBlogPost
      tags: [Blogs]
      security:
        - bearerAuth: []
      responses:
        "201":
          description: Blog post created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
  /admin/blogs/{id}:
    get:
      summary: Get blog post by id
      operationId: getAdminBlog
      tags: [Blogs]
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
          description: Blog post
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    patch:
      summary: Update a blog post
      operationId: updateBlogPost
      tags: [Blogs]
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
          description: Blog post updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SuccessEnvelope"
    delete:
      summary: Soft-delete a blog post
      operationId: deleteBlogPost
      tags: [Blogs]
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
          description: Blog post deleted
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
    AdminCreateReservationRequest:
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
        tableId:
          type: string
          format: uuid
          description: Optional cafe table assignment
        status:
          type: string
          enum: [pending, confirmed]
          description: Defaults to confirmed for staff bookings
        notifyGuest:
          type: boolean
          description: Defaults to true; confirmed bookings send confirmed mail only
    CafeTableRequest:
      type: object
      required: [name, capacity]
      properties:
        code:
          type: string
          description: Required on create; ignored on update
          example: T6
        name:
          type: string
          example: Patio Two
        capacity:
          type: integer
          minimum: 1
        isActive:
          type: boolean
          description: Defaults to true
        sortOrder:
          type: integer
    ClosedDayRequest:
      type: object
      required: [closedDate]
      properties:
        closedDate:
          type: string
          format: date
        label:
          type: string
          example: Independence Day
        note:
          type: string
    CreateContactMessageRequest:
      type: object
      required: [fullName, email, message]
      properties:
        fullName:
          type: string
          maxLength: 120
        email:
          type: string
          format: email
        phone:
          type: string
          maxLength: 40
        message:
          type: string
          minLength: 1
          maxLength: 5000
    UpdateContactMessageStatusRequest:
      type: object
      required: [status]
      properties:
        status:
          type: string
          enum: [new, read, archived]
`
