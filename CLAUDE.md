# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
./mvnw spring-boot:run          # Start server on http://localhost:8080
./mvnw test                     # Run all tests
./mvnw test -Dtest=ClassName    # Run a single test class
./mvnw package                  # Build JAR
```

H2 in-memory database — no external DB required. Resets on every restart (`create-drop`). SQL is logged to stdout; Security debug logs are enabled.

## Architecture

Spring Boot 3 REST API with JWT auth, role-based access control, and an event-driven notification layer.

### Package layout

```
utec.week07.solution/
├── Configuration.java              # All Spring beans: Security, ModelMapper, TaskExecutor, BCrypt
├── RestControllerAdviceHandler.java # Global exception → HTTP mapping
├── auth/
│   ├── AuthService.java            # UserDetailsService (loads by username)
│   ├── AuthController.java         # POST /auth/login → JWT token
│   ├── JwtAuthFilter.java          # OncePerRequestFilter: validates Bearer token, sets SecurityContext
│   ├── AuthLoginDTO / AuthTokenDTO
├── users/
│   ├── domain/User.java            # JPA entity + UserDetails; table name: app_user; single role field
│   ├── domain/UserService.java     # register, findById, findAll
│   ├── controllers/UserController.java
├── flights/
│   ├── domain/Flight.java          # Entity: flightNumber, airline, departure/arrival, availableSeats
│   ├── domain/Booking.java         # Entity: customer (User), flight, bookingDate
│   ├── domain/FlightService.java   # All booking business logic (see below)
│   ├── domain/OnFlightCreated.java / OnBookingCreated.java   # ApplicationEvent subclasses
│   ├── domain/FlightNotificationService.java  # @EventListener → writes flight_booking_email_<id>.txt
│   ├── domain/BookingNotificationService.java # ApplicationListener → writes flight_booking_email_<id>.txt
│   ├── controllers/FlightController.java
│   └── infrastructure/Flight/BookingRepository.java
├── cleanup/CleanupController.java  # DELETE /cleanup — wipes all data (test helper)
└── common/
    ├── ValidationException.java    # Business rule violations → 400 ProblemDetail
    └── NewIdDTO.java               # { id } response wrapper
```

### Security model

- `SecurityFilterChain` has **no `authorizeHttpRequests` rules** — all authorization is done per-method with `@PreAuthorize` (`permitAll()`, `isAuthenticated()`, `hasRole('ADMIN')`).
- `GrantedAuthorityDefaults("")` strips the default `ROLE_` prefix, so roles are stored and compared as plain strings (`USER`, `ADMIN`).
- `JwtAuthFilter` decodes the token and reads the `role` claim to populate authorities — it does **not** re-read the role from the DB.
- JWT secret is hardcoded as `"my-secret"` in `JwtAuthFilter`. Issuer: `"my-app"`. No expiry set on tokens.

### Booking business rules (FlightService)

1. Cannot book a flight whose departure or arrival is in the past.
2. Cannot book two flights with overlapping time windows (checked against the current user's existing bookings).
3. `book()` is `@Transactional`: saves booking + reduces `availableSeats` atomically, then fires `OnBookingCreated`.

### Event / notification pattern

Two styles are demonstrated side by side:
- `FlightNotificationService` — uses `@EventListener` annotation (listens for `OnFlightCreated`). **Note:** `OnFlightCreated` is never actually published in the current code — this is intentional dead code for demonstration.
- `BookingNotificationService` — implements `ApplicationListener<OnBookingCreated>` (interface style). Triggered on every successful booking.

Both write a `.txt` file to the working directory simulating an email.

### Bulk flight creation

`POST /flights/create-many` is `@Async` — returns immediately (201) while flights are created in a background thread (`SimpleAsyncTaskExecutor`).

### DTO / mapping convention

`ModelMapper` is used throughout to map between entities and DTOs. Controllers inject both the service and `ModelMapper` directly.
