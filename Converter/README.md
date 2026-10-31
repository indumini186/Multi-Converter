# Multi-Converter Monorepo

A unified application to convert currency and temperature, structured into a clean monorepo with a separate Frontend (BFF Gateway + Static UI) and two Backend Microservices.

## Project Structure

```text
d:\Converter\
├── frontend\
│   ├── public\          <--- Unified Static UI (index.html, app.js, style.css)
│   ├── package.json     <--- Node.js Dependencies (Express, Cors, Dotenv, etc.)
│   └── server.js        <--- BFF / Proxy Gateway (Express) - Secures & injects API Key (Port 3000)
└── backend\
    ├── currency-service\     <--- Java Spring Boot Microservice (Port 8081)
    └── temperature-service\  <--- Java Spring Boot Microservice (Port 8080)
```

## Dockerized Setup (Recommended)

You can run the entire stack (Frontend BFF, Temperature Microservice, Currency Microservice, and MongoDB) with a single command using Docker Compose.

### Prerequisites
* Ensure **Docker Desktop** is installed and running.
* Ensure ports `3000`, `8080`, `8081`, and `27017` are not in use by other processes.

### Running with Docker Compose
1. Navigate to the root directory `d:\Converter\`.
2. Run the following command:
   ```bash
   docker-compose up --build
   ```
3. Once all containers are active, access the application in your browser:
   * **App URL**: `http://localhost:3000`
4. To stop the containers, run:
   ```bash
   docker-compose down
   ```

---

## Manual Service Configuration & Setup

### 1. MongoDB Database Setup

The backend microservices require a running MongoDB instance to store logs. Both services run on the same MongoDB instance but use separate databases.

* **MongoDB Connection Port**: `27017`
* **Databases**:
  * `tempconverter` (for Temperature Service)
  * `currencyconverter` (for Currency Service)

> [!NOTE]
> Make sure the MongoDB server is running on port 27017 before starting the backend microservices.


### 2. Backend Services Setup

#### Start Temperature Microservice
1. Navigate to `backend/temperature-service`.
2. Run the application:
   ```bash
   mvnw.cmd spring-boot:run
   ```
   * Runs on port: `http://localhost:8080`
   * Automatically seeds the database with the required active API key: `SUPER-SECRET-DEV-KEY-123`.

#### Start Currency Microservice
1. Navigate to `backend/currency-service`.
2. Run the application:
   ```bash
   mvnw.cmd spring-boot:run
   ```
   * Runs on port: `http://localhost:8081`

---

### 3. Frontend BFF Gateway Setup

The Node.js Express server acts as a Backend-For-Frontend (BFF) proxy gateway. It serves the static files and forwards requests securely to the Spring Boot microservices, injecting the secret API Key for temperature conversion on the fly.

1. Navigate to `frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   * Gateway URL: `http://localhost:3000`

---

## Security Design

The client-side UI has been completely decoupled from the system's secret keys:
* There are **no API Key inputs** on the user interface.
* When a user requests a temperature conversion, the frontend app sends a request to `/api/temperature/convert` on the BFF.
* The Express server at `frontend/server.js` intercepts this request and injects the header `X-API-Key: SUPER-SECRET-DEV-KEY-123` before forwarding it to the Spring Boot backend, preventing the key from being exposed to the client browser.
