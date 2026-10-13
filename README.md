# SLSEA Solar Generation Monitoring API

A secure, cloud-hosted RESTful API for monitoring, managing, and analysing solar electricity generation across Sri Lanka.

## 1. Project Overview

The SLSEA Solar Generation Monitoring API is a backend system designed to support the collection, management, and retrieval of solar electricity generation data from distributed installations across Sri Lanka.

The system models a national solar generation monitoring platform inspired by the requirements of the Sri Lanka Sustainable Energy Authority (SLSEA).

It provides structured access to solar installations, electricity generation readings, geographical information, weather observations, and forecasting data.

The API follows RESTful architectural principles, uses JSON representations, and implements authentication and role-based access controls to distinguish between monitoring devices and authorised data consumers.

The application is developed using Node.js and Express, with PostgreSQL hosted on Supabase. Authentication is integrated with Auth0, and the API is deployed through Render.

> **Project disclaimer:** This is an academic prototype. It is not an official SLSEA service. Unless explicitly stated otherwise, demonstration installation and generation data are synthetic.

## 2. Objectives

The primary objectives are to:

- Design and implement a RESTful API for solar generation monitoring.
- Represent Sri Lanka's provincial, district, and electricity grid infrastructure hierarchy.
- Manage solar installation information and generation readings.
- Support historical electricity generation data retrieval.
- Apply secure authentication and authorisation mechanisms.
- Enforce installation-level and jurisdiction-based access restrictions.
- Provide consistent HTTP responses, validation, pagination, and error handling.
- Integrate weather information to support energy monitoring and forecasting.
- Deploy the application using publicly accessible cloud infrastructure.
- Document the API through an OpenAPI specification and Swagger UI.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Runtime | Node.js |
| Programming Language | JavaScript (ES Modules) |
| API Framework | Express.js 5 |
| Database | PostgreSQL |
| Cloud Database | Supabase |
| Authentication | Auth0, OAuth 2.0 / OpenID Connect |
| Token Validation | JWT, RS256 |
| Request Validation | Zod |
| API Documentation | OpenAPI / Swagger UI |
| Automated Testing | Vitest |
| Cloud Hosting | Render |
| Version Control | Git |
| Repository Hosting | GitHub |
| API Testing | Postman, Swagger UI, cURL |
| Database Migrations | Supabase CLI / SQL |

## 4. System Architecture

The application follows a layered backend architecture, separating HTTP request handling, business logic, and database operations.

```text
              API Clients
                   |
       +-----------+-----------+
       |                       |
  Monitoring Devices      Data Consumers
       |                       |
       +-----------+-----------+
                   |
                HTTPS
                   |
              Render Cloud
                   |
          Express.js REST API
                   |
       Authentication Middleware
                   |
       Authorisation Middleware
                   |
          Request Validation
                   |
             Controllers
                   |
               Services
                   |
             Repositories
                   |
           Supabase PostgreSQL
```

External services:

```text
Auth0
  |
  +-- Access Token Issuance
  +-- JWT Signature Verification
  +-- OAuth Scopes and Claims

Weather Provider
  |
  +-- External Weather Forecast Data

Swagger UI
  |
  +-- OpenAPI Documentation
  +-- Interactive API Testing
```

### Architectural Layers

**Routes:** Define API endpoints and connect requests to middleware and controllers.

**Controllers:** Handle HTTP requests, responses, status codes, and application errors.

**Services:** Implement business logic and coordinate application operations.

**Repositories:** Perform database queries and isolate persistence logic.

**Middleware:** Handles authentication, authorisation, request validation, rate limiting, and error processing.

**Validators:** Validate incoming request parameters and payloads.

This architecture improves maintainability, testability, and separation of concerns.

## 5. Core Features

### 5.1 Solar Installation Management

The system supports solar installation registration, retrieval, modification, and deletion.

Installation information includes:

- Unique installation identifier
- Installation code and name
- Installation type
- Operator information
- Geographical location
- Latitude and longitude
- Installed generation capacity
- Commissioning date
- Associated grid substation
- Operational status
- Creation and modification timestamps

Installation records use UUID identifiers.

### 5.2 Geographical Hierarchy

The database supports the following geographical hierarchy:

```text
Sri Lanka
   |
   +-- Provinces
         |
         +-- Districts
               |
               +-- Grid Substations
                     |
                     +-- Solar Installations
                           |
                           +-- Generation Readings
```

The intended reference dataset covers:

| Entity | Target |
|---|---:|
| Provinces | 9 |
| Districts | 25 |
| Grid Substations | At least 20 |
| Solar Installations | At least 200 |
| Historical Readings | 7 days per installation |
| Reading Frequency | Every 15 minutes |

These are coursework dataset targets, not a guarantee of current database contents.

### 5.3 Solar Generation Monitoring

The API manages timestamped solar generation readings.

Generation data includes:

- Installation identifier
- Reading timestamp
- Generated power in kilowatts (kW)
- Generated energy in kilowatt-hours (kWh)
- Voltage in volts (V)

Historical records can be retrieved using supported pagination, time-range filtering, and sorting parameters.

### 5.4 Weather Integration

Weather information can provide additional context for analysing changes in solar electricity output.

The system supports weather observation records and an external weather forecasting integration.

Weather measurements include:

- Temperature
- Solar irradiance
- Cloud cover
- Wind speed
- Relative humidity

Weather forecasts provide supplementary information and are not equivalent to validated solar power-generation predictions.

### 5.5 Security

The API integrates Auth0 for identity and access-token management.

The security design distinguishes between:

**Monitoring Devices:** Trusted installation-specific clients authorised to submit generation readings.

**Data Consumers:** Authenticated users or services permitted to retrieve installation and generation information.

The intended authorisation model supports national, provincial, and district access boundaries.

Protected operations must validate JWT signatures, token issuer, audience, relevant scopes, and resource ownership or jurisdiction.

### 5.6 API Documentation

Swagger UI provides interactive API documentation generated from the OpenAPI specification.

It supports inspection of documented routes, request schemas, response formats, and authentication requirements.

## 6. Database Design

The application uses PostgreSQL with relational constraints, foreign keys, and indexes to maintain data consistency.

### 6.1 Database Entities

| Table | Purpose |
|---|---|
| `provinces` | Sri Lankan provincial reference data |
| `districts` | District information linked to provinces |
| `grid_substations` | Electricity grid substations associated with districts |
| `solar_sites` | Solar installation records |
| `solar_generation` | Timestamped electricity generation readings |
| `weather_data` | Historical weather observations |
| `forecasts` | Stored solar generation predictions |

The `solar_sites` table represents installations in the existing database schema.

### 6.2 Entity Relationships

```text
provinces
   |
   | 1:N
   v
districts
   |
   | 1:N
   v
grid_substations
   |
   | 1:N
   v
solar_sites
   |
   +------------------+
   |                  |
   | 1:N              | 1:N
   v                  v
solar_generation   weather_data
   |
   +-- Installation Reading History

solar_sites
   |
   | 1:N
   v
forecasts
```

Key design decisions include:

- UUID identifiers for solar installations.
- Relational foreign keys for geographical associations.
- Timestamped generation records for chronological retrieval.
- Database constraints for valid numerical ranges.
- Indexes for installation and time-based queries.
- Additive database migrations to preserve existing records.
- Separation of installation metadata from operational readings.

PostgreSQL Row-Level Security is enabled on the original operational tables, but application-level authorisation must still be enforced independently.

## 7. API Endpoints

The base API prefix is:

```text
/api/v1
```

### 7.1 Health Monitoring

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Application root |
| GET | `/api/v1/health` | Application health check |
| GET | `/api/v1/health/database` | Database connectivity check |

### 7.2 Solar Installations

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/sites` | List solar installations |
| POST | `/api/v1/sites` | Register an installation |
| GET | `/api/v1/sites/{id}` | Retrieve an installation |
| PUT | `/api/v1/sites/{id}` | Update an installation |
| DELETE | `/api/v1/sites/{id}` | Delete an installation |

Supported list-query parameters include:

```text
page
limit
active
```

Example:

```http
GET /api/v1/sites?page=1&limit=20&active=true
```

### 7.3 Generation Readings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/sites/{siteId}/generation` | Submit generation data |
| GET | `/api/v1/sites/{siteId}/generation` | Retrieve generation history |
| GET | `/api/v1/sites/{siteId}/generation/{id}` | Retrieve a reading |

Supported historical-reading query parameters include:

```text
page
limit
from
to
sort
```

Example:

```http
GET /api/v1/sites/{siteId}/generation?from=2026-10-01T00:00:00Z&to=2026-10-08T00:00:00Z&sort=desc
```

### 7.4 Weather Data

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/sites/{siteId}/weather` | Create a weather observation |
| GET | `/api/v1/sites/{siteId}/weather` | Retrieve weather history |
| GET | `/api/v1/sites/{siteId}/weather/{id}` | Retrieve a weather observation |
| GET | `/api/v1/sites/{siteId}/weather/forecast` | Retrieve external weather forecasts |

### 7.5 Geographic and Extended API Resources

The extended coursework API design includes:

```http
GET /api/v1/provinces

GET /api/v1/provinces/{id}/districts

GET /api/v1/districts/{id}/substations

GET /api/v1/substations/{id}/installations

GET /api/v1/installations/{id}/overview

GET /api/v1/installations/{id}/latest-reading

POST /api/v1/installations/{id}/readings

GET /api/v1/readings?districtId={id}&from={timestamp}&to={timestamp}

GET /api/v1/districts/{id}/generation-summary
```

These extended resources form part of the coursework implementation backlog. Their availability must be confirmed against the current application routes and Swagger documentation before production use.

## 8. HTTP Response Design

The API uses JSON responses and standard HTTP status codes.

### Successful Response

Example:

```json
{
  "success": true,
  "data": [
    {
      "id": "588f49ed-0b04-43b0-9617-d078af39e321",
      "name": "SLSEA Colombo Solar Site",
      "location": "Colombo, Sri Lanka",
      "latitude": 6.927079,
      "longitude": 79.861244,
      "capacityKw": 100,
      "timezone": "Asia/Colombo",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 OK | Successful retrieval or update |
| 201 Created | Resource created |
| 204 No Content | Successful operation without a response body |
| 304 Not Modified | Cached representation is still valid |
| 400 Bad Request | Invalid request |
| 401 Unauthorized | Missing or invalid credentials |
| 403 Forbidden | Insufficient permissions |
| 404 Not Found | Resource not found |
| 409 Conflict | Conflicting or duplicate data |
| 422 Unprocessable Content | Semantically invalid request |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Unexpected server error |

The API uses appropriate status codes according to the implemented endpoint behaviour. Support for conditional requests, `Location` headers, and pagination navigation links should be verified on each relevant resource.

## 9. Authentication and Authorisation

Authentication is integrated with Auth0 using OAuth 2.0 and RS256-signed JSON Web Tokens.

### Authentication Flow

```text
API Client
    |
    v
Auth0 Token Endpoint
    |
    v
JWT Access Token
    |
    v
API Request
Authorization: Bearer <token>
    |
    v
JWT Verification
    |
    v
Permission and Jurisdiction Validation
    |
    v
Protected API Resource
```

### Token Validation

The API authentication layer is designed to validate:

- JWT signature using the authorised public signing keys.
- Configured issuer.
- Configured API audience.
- Token expiration.
- Required permissions or scopes.
- Role and jurisdiction claims where applicable.

### Authorisation Model

The intended access model includes:

| Identity | Intended Access |
|---|---|
| Installation device | Submit readings for its assigned installation |
| District consumer | Read authorised district information |
| Provincial consumer | Read authorised provincial information |
| National consumer | Read permitted nationwide information |

Example permission names:

```text
readings:write
data:read
```

These names describe the intended access model and must correspond to the actual Auth0 API permission configuration and middleware implementation.

Unauthenticated access to protected operational resources must not be allowed.

## 10. Getting Started

### 10.1 Prerequisites

Install or prepare the following:

- Node.js compatible with the version specified in `package.json`
- npm
- Git
- PostgreSQL-compatible Supabase project
- Auth0 tenant and API configuration

Optional tools:

- Supabase CLI
- Postman
- PostgreSQL client

Docker is not required for running the Node.js application.

### 10.2 Clone Repository

```bash
git clone https://github.com/Heshanx/slsea-solar-gen-api.git
```

Navigate into the project:

```bash
cd slsea-solar-gen-api
```

### 10.3 Install Dependencies

```bash
npm install
```

### 10.4 Configure Environment Variables

Create a local `.env` file using the project's environment example or documented configuration.

Example configuration:

```dotenv
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

AUTH0_ISSUER_BASE_URL=https://YOUR_TENANT.auth0.com/
AUTH0_AUDIENCE=YOUR_API_IDENTIFIER
```

Use the exact Auth0 configuration variable names expected by the authentication middleware if they differ from this example.

The database connection string must use the correct Supabase database endpoint and credentials.

Never commit `.env`, access tokens, database credentials, or private authentication secrets.

### 10.5 Start Development Server

```bash
npm run dev
```

For standard application startup:

```bash
npm start
```

Once started, the API is available at the configured local port.

For example:

```text
http://localhost:3000
```

Test application health:

```http
GET http://localhost:3000/api/v1/health
```

Test database connectivity:

```http
GET http://localhost:3000/api/v1/health/database
```

## 11. Database Migrations

Database schema changes are managed through versioned SQL migrations stored in the Supabase migration directory.

The migration history includes the original operational schema and subsequent additive changes for geographical hierarchy and additional generation attributes.

Before applying migrations:

1. Confirm the intended Supabase project and database.
2. Review pending migration SQL.
3. Ensure a database backup is available.
4. Test schema modifications against a disposable environment.
5. Verify foreign-key relationships and constraints.

When the Supabase CLI is configured and linked to the correct development project, migrations can be applied using:

```bash
supabase db push
```

Do not apply unreviewed migrations directly to production.

## 12. Database Seeding

The coursework requires a representative national solar installation dataset.

The target dataset comprises:

- 9 provinces
- 25 districts
- At least 20 grid substations
- At least 200 solar installations
- At least 7 days of generation readings for each installation
- Readings at 15-minute intervals

For 200 installations, the minimum seven-day dataset contains:

```text
96 readings per installation per day

96 × 7 = 672 readings per installation

672 × 200 = 134,400 readings
```

At 220 installations, the corresponding target is 147,840 readings.

### Recommended Seeding Order

```text
1. Provinces
       |
2. Districts
       |
3. Grid Substations
       |
4. Solar Installations
       |
5. Generation Readings
       |
6. Weather Observations (optional)
```

Seed operations should preserve foreign-key relationships and avoid unnecessary duplicates.

Synthetic generation readings should be reproducible, chronologically valid, and constrained by the installations' rated generation capacities.

The database should distinguish demonstration data from genuine operational observations.

**Note:** The seeding approach and target volumes are documented here; the exact seed command and completed record counts depend on the current repository scripts and database state.

## 13. Testing

Automated tests are implemented using Vitest.

The test suite covers functionality such as:

- Health-check endpoints
- Database and application response behaviour
- CORS configuration
- Request validation
- Rate limiting
- Weather-provider integration
- Authentication
- Solar installation operations
- Generation query behaviour

Execute the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### API Integration Testing

Postman, Swagger UI, or cURL can be used to verify:

- Successful authenticated requests
- Invalid or missing JWTs
- Authorisation and jurisdiction restrictions
- Invalid payload handling
- Historical-data filtering
- Pagination
- Duplicate reading handling
- HTTP response headers
- Database connectivity

The full set of passing tests and verified endpoint behaviours should be recorded from the current repository revision.

## 14. API Documentation

Swagger UI exposes the OpenAPI specification and provides an interactive testing interface.

### Local Documentation

```text
http://localhost:3000/api/v1/docs
```

### Hosted Documentation

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/v1/docs
```

For protected endpoints:

1. Obtain a valid Auth0 access token.
2. Open Swagger UI.
3. Select **Authorize**.
4. Supply the token using the interface's expected Bearer authentication format.
5. Execute the endpoint request.

Swagger documentation should reflect the deployed application version and its implemented endpoint schemas.

## 15. Deployment

The backend application is hosted using Render, with PostgreSQL managed through Supabase.

### Deployment Architecture

```text
                 Internet
                    |
                    v
                HTTPS API
                    |
                    v
              Render Web Service
                    |
                    v
            Node.js / Express API
                    |
          +---------+---------+
          |                   |
          v                   v
     Supabase DB         Auth0 Identity
     PostgreSQL          Token Validation
```

### Render Configuration

Typical application settings:

| Setting | Value |
|---|---|
| Runtime | Node.js |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Environment | Production |
| Database | Supabase PostgreSQL |
| Transport | HTTPS |

The required environment variables must be configured securely in Render.

### Deployment Verification

After deployment, verify:

```http
GET https://YOUR-RENDER-SERVICE.onrender.com/api/v1/health
```

```http
GET https://YOUR-RENDER-SERVICE.onrender.com/api/v1/health/database
```

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/v1/docs
```

The database configuration must use a reachable Supabase endpoint. Where required, use the appropriate Supabase connection pooler.

Database TLS and least-privilege credentials are deployment requirements.

## 16. Security Considerations

Security mechanisms include or are planned to include:

- HTTPS for hosted API communication.
- Auth0-based access-token verification.
- RS256 JWT validation.
- Role- and permission-based authorisation.
- Jurisdiction-restricted resource access.
- Installation-specific device write permissions.
- Zod request validation.
- Rate limiting.
- Database constraints and foreign keys.
- Secure environment variable handling.
- Controlled cross-origin resource sharing.
- Restricted database credentials.

The implementation must not treat JWT decoding alone as successful authentication. Cryptographic signature verification and applicable claims validation are required.

Secrets and production access credentials must not appear in repository files, screenshots, API documentation, or example responses.

## 17. RESTful Design Principles

The API is designed around REST principles.

### Resource-Oriented URIs

Resources are represented using nouns:

```text
/sites
/sites/{id}
/sites/{siteId}/generation
/provinces
/districts
/installations
```

### HTTP Methods

Standard HTTP methods distinguish operations:

- `GET` retrieves resources.
- `POST` creates resources.
- `PUT` updates resources.
- `DELETE` removes resources.

### Statelessness

Individual API requests contain the information necessary for authentication and processing.

### JSON Representations

Structured responses use JSON with consistent property naming and response envelopes.

### Conditional Requests

ETag-based conditional retrieval is part of the implementation requirements. Where supported, the API can respond with `304 Not Modified` when the client's cached representation remains current.

### Richardson Maturity Model

The API primarily targets **Level 2**, using resource-oriented URIs and HTTP methods and status codes.

Full Richardson Level 3 maturity would require consistent hypermedia controls that guide clients through available resource transitions.

## 18. Project Structure

The repository follows an organised Express application structure.

```text
slsea-solar-gen-api/
|
+-- src/
|   |
|   +-- config/
|   |   +-- swagger.js
|   |
|   +-- controllers/
|   |
|   +-- middleware/
|   |
|   +-- repositories/
|   |
|   +-- routes/
|   |   +-- index.js
|   |
|   +-- services/
|   |
|   +-- validators/
|   |
|   +-- utils/
|       +-- mappers/
|
+-- supabase/
|   +-- migrations/
|
+-- tests/
|
+-- package.json
+-- package-lock.json
+-- README.md
```

The precise files within these directories may vary by development revision.

## 19. Current Scope and Limitations

The project contains a working foundation for solar installation management, generation-record retrieval, weather integration, API documentation, and cloud deployment.

The following items require final verification or completion against the coursework requirements:

- Complete national reference and operational data seeding.
- Full geographical hierarchy endpoint coverage.
- Installation-specific device authentication and write restrictions.
- District and provincial jurisdiction enforcement.
- Composite installation overview resources.
- Latest-reading retrieval.
- Cross-installation historical reading queries.
- District-level generation summaries.
- Pagination navigation links.
- Consistent `201 Created` and `Location` response headers.
- Conditional GET and ETag coverage.
- Production authentication and authorisation test evidence.
- Deployment security configuration and regression testing.

These limitations should be evaluated against the final application rather than assumed to be unresolved after subsequent development.

## 20. Future Improvements

Potential improvements include:

- Real-time generation ingestion through device gateways.
- Monitoring dashboards and visual analytics.
- Advanced district and provincial generation reporting.
- Time-series database optimisation.
- Solar generation forecasting using trained prediction models.
- Automated anomaly detection.
- Improved API observability and logging.
- Background processing for high-volume ingestion.
- Automated deployment and integration testing.

## 21. Academic Context

**Module:** NB6007CEM – Web API Development  
**Programme:** BSc (Hons) Computing  
**Awarding University:** Coventry University, United Kingdom  
**Delivery Institution:** National Institute of Business Management (NIBM), Sri Lanka  
**Project:** SLSEA Solar Generation Monitoring API

The implementation demonstrates REST API development, relational database modelling, identity and access management, request validation, software testing, cloud deployment, and API design evaluation.

The accompanying coursework report documents and critically evaluates the architectural decisions, resource design, security approach, deployment, and Richardson Maturity level.

## 22. Repository

**GitHub Repository:**  
https://github.com/Heshanx/slsea-solar-gen-api

## 23. Author

Developed for academic coursework under the BSc (Hons) Computing programme offered by Coventry University through NIBM Sri Lanka.

## 24. Disclaimer

This repository is an educational implementation demonstrating a solar electricity generation monitoring API.

It is not affiliated with, endorsed by, or operated as an official production system of the Sri Lanka Sustainable Energy Authority.

Synthetic datasets, example credentials, and demonstration responses are intended for development, testing, and academic assessment purposes only.
