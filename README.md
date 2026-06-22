# CS2031 Week 07 – Flight Booking System API

REST API for a flight booking system built with Spring Boot, JWT authentication, and an event-driven notification layer. Developed as part of the CS2031 course at UTEC.

## Technologies

- Java 21 / Spring Boot 3.5
- Spring Security 6 + JWT (Auth0 java-jwt)
- Spring Data JPA / H2 in-memory database
- Lombok, ModelMapper, Jakarta Validation
- Maven

## Requirements

- **Java 21** — verify with `java -version`
- **No external database needed** — the project uses H2, an in-memory database that runs inside the app

## Running the Server

```bash
./mvnw spring-boot:run
```

The server starts on `http://localhost:8080`. You should see a line like:

```
Started Week07SolutionApplication in 3.2 seconds
```

> **Note:** The H2 database lives entirely in memory. Every time you stop and restart the server, all data (users, flights, bookings) is wiped. This is expected — use `POST /users/register` and `POST /flights/create` again after each restart.

## Inspecting the Database (H2 Console)

While the server is running, you can browse the database at:

```
http://localhost:8080/h2-console
```

Use these connection settings:

| Field | Value |
|-------|-------|
| JDBC URL | `jdbc:h2:mem:testdb` |
| User Name | `sa` |
| Password | *(leave blank)* |

Click **Connect** — you can then run SQL queries directly against the live data.

---

## Authentication

Protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Get a token by registering a user and then logging in (see below). There are two roles:

| Role | Who has it |
|------|-----------|
| `USER` | Every registered user |
| `ADMIN` | Must be set manually in the database (no register endpoint for admins) |

---

## Endpoints

### Auth

#### `POST /auth/login`

No authentication required.

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "Password1"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` — missing fields or user not found

---

### Users

#### `POST /users/register`

No authentication required. Creates a new user with role `USER`.

**Request body:**
```json
{
  "email": "alice@example.com",
  "firstName": "Alice",
  "lastName": "Smith",
  "password": "Password1"
}
```

> **Password rules:** minimum 8 characters, at least one uppercase letter, at least one digit.
> **Name rules:** `firstName` and `lastName` must start with an uppercase letter.

**Response `201 Created`:**
```json
{ "id": 1 }
```

**Errors:**
- `400` — validation failure (password too weak, name format wrong, email already registered)

---

#### `GET /users/current`

Requires: any authenticated user (`USER` or `ADMIN`).

Returns the profile of the currently logged-in user.

**Response `200 OK`:**
```json
{
  "id": 1,
  "username": "alice@example.com",
  "email": "alice@example.com",
  "firstName": "Alice",
  "lastName": "Smith",
  "role": "USER"
}
```

---

#### `GET /users/{id}`

Requires: `ADMIN`.

Returns the profile of any user by their ID.

**Response `200 OK`:** same shape as `/users/current`.

**Errors:**
- `403` — caller is not an admin
- `500` — user ID not found

---

#### `GET /users`

Requires: `ADMIN`.

Returns a list of all registered users.

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "username": "alice@example.com",
    "email": "alice@example.com",
    "firstName": "Alice",
    "lastName": "Smith",
    "role": "USER"
  }
]
```

---

### Flights

#### `POST /flights/create`

No authentication required.

**Request body:**
```json
{
  "airlineName": "LATAM",
  "flightNumber": "LA123",
  "estDepartureTime": "2026-12-01T10:00:00Z",
  "estArrivalTime": "2026-12-01T14:00:00Z",
  "availableSeats": 100
}
```

> **Flight number format:** 2–3 uppercase letters followed by exactly 3 digits (e.g. `LA123`, `AMX456`).

**Response `201 Created`:**
```json
{ "id": 1 }
```

**Errors:**
- `400` — flight number already exists or validation failure

---

#### `POST /flights/create-many`

No authentication required. Creates multiple flights asynchronously — the server returns immediately while flights are saved in the background.

**Request body:**
```json
{
  "inputs": [
    {
      "airlineName": "LATAM",
      "flightNumber": "LA124",
      "estDepartureTime": "2026-12-02T08:00:00Z",
      "estArrivalTime": "2026-12-02T12:00:00Z",
      "availableSeats": 80
    },
    {
      "airlineName": "Avianca",
      "flightNumber": "AV200",
      "estDepartureTime": "2026-12-03T15:00:00Z",
      "estArrivalTime": "2026-12-03T19:00:00Z",
      "availableSeats": 60
    }
  ]
}
```

**Response `201 Created`:** empty body — flights are being created in the background.

---

#### `GET /flights`

No authentication required.

Returns a list of all flights.

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "airlineName": "LATAM",
    "flightNumber": "LA123",
    "estDepartureTime": "2026-12-01T10:00:00.000+00:00",
    "estArrivalTime": "2026-12-01T14:00:00.000+00:00",
    "availableSeats": 100
  }
]
```

---

#### `GET /flights/{id}`

No authentication required.

Returns a single flight by ID.

**Response `200 OK`:** same shape as one item from `GET /flights`.

**Errors:**
- `500` — flight ID not found

---

#### `GET /flights/search`

No authentication required.

All query parameters are optional and can be combined.

| Parameter | Type | Description |
|-----------|------|-------------|
| `flightNumber` | string | Substring match on flight number |
| `airlineName` | string | Substring match on airline name |
| `estDepartureTimeFrom` | ISO-8601 string | Lower bound on departure time (e.g. `2026-12-01T00:00:00Z`) |
| `estDepartureTimeTo` | ISO-8601 string | Upper bound on departure time |

**Example:**
```
GET /flights/search?airlineName=LATAM&estDepartureTimeFrom=2026-12-01T00:00:00Z
```

**Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 1,
      "airlineName": "LATAM",
      "flightNumber": "LA123",
      "estDepartureTime": "2026-12-01T10:00:00.000+00:00",
      "estArrivalTime": "2026-12-01T14:00:00.000+00:00",
      "availableSeats": 100
    }
  ]
}
```

---

#### `POST /flights/book`

Requires: any authenticated user.

Books a flight for the currently logged-in user.

**Request body:**
```json
{ "flightId": 1 }
```

**Response `200 OK`:**
```json
{ "id": 1 }
```

**Errors:**
- `400` — flight has already departed, or it overlaps with another booking the user already has, or no available seats
- `401` — not authenticated

---

#### `GET /flights/book/{id}`

Requires: any authenticated user.

Returns the details of a booking by its ID.

**Response `200 OK`:**
```json
{
  "id": 1,
  "bookingDate": "2026-06-22T14:30:00.000+00:00",
  "flightId": 1,
  "flightNumber": "LA123",
  "estDepartureTime": "2026-12-01T10:00:00.000+00:00",
  "estArrivalTime": "2026-12-01T14:00:00.000+00:00",
  "customerId": 1,
  "customerFirstName": "Alice",
  "customerLastName": "Smith"
}
```

---

### Utilities

#### `DELETE /cleanup`

No authentication required. **Deletes all bookings, flights, and users.** For testing only.

**Response `200 OK`:** empty body.

---

## Booking Business Rules

1. **Past flights** — cannot book a flight whose departure or arrival time is already in the past.
2. **Overlapping flights** — cannot book a flight if you already have a booking whose time window overlaps with it.
3. **Seat count** — booking atomically reduces `availableSeats` by 1.
4. **Notifications** — every successful booking writes a `.txt` file to the working directory (simulates an email notification via Spring application events).

---

## Quick Start Walkthrough

```bash
# 1. Start the server
./mvnw spring-boot:run

# 2. Register a user
curl -s -X POST http://localhost:8080/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","firstName":"Alice","lastName":"Smith","password":"Password1"}'

# 3. Log in and get a token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Password1"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 4. Create a flight (open — no auth needed)
curl -s -X POST http://localhost:8080/flights/create \
  -H "Content-Type: application/json" \
  -d '{"airlineName":"LATAM","flightNumber":"LA123","estDepartureTime":"2026-12-01T10:00:00Z","estArrivalTime":"2026-12-01T14:00:00Z","availableSeats":100}'

# 5. Book the flight
curl -s -X POST http://localhost:8080/flights/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"flightId":1}'
```

---

## Project Structure

```
src/main/java/utec/week07/solution/
├── Configuration.java              # Security, ModelMapper, async executor
├── RestControllerAdviceHandler.java # Global exception → HTTP mapping
├── auth/                           # JwtAuthFilter, login controller
├── users/                          # User entity, registration, role
├── flights/                        # Flight & Booking logic, events, search
├── cleanup/                        # DELETE /cleanup test helper
└── common/                         # ValidationException, NewIdDTO
```
