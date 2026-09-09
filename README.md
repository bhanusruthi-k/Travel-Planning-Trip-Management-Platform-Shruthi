# TripNest – Travel Planning & Trip Management Platform

## 📌 Project Overview

**TripNest** is a full-stack travel planning and trip management platform designed to help travelers plan, organize, and manage their trips from one place.

The platform provides features for trip creation, itinerary planning, budget and expense management, destination discovery, group collaboration, notifications, user profiles, and role-based access control.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Role-based access control
* Traveler, Group Admin, and Administrator roles
* Common login for all users

### ✈️ Trip Management

* Create and manage trips
* View trip details
* Trip status management
* Trip members and collaboration

### 🗓️ Itinerary Management

* Add activities to trips
* Organize activities by date/time
* View complete trip itinerary

### 💰 Budget & Expense Management

* Set trip budgets
* Add and manage expenses
* Categorize expenses
* Track spending against budget
* Budget analytics

### 👥 Group Collaboration

* Invite travelers to trips
* Accept/reject invitations
* Manage trip members
* Role-based member management

### 🌍 Destination Discovery

* Browse destinations
* Search and filter destinations
* Destination details
* Attractions
* Popular destinations

### 🔔 Notifications

* Trip-related notifications
* Invitation notifications
* Important travel updates
* Budget/reminder notifications

### 👤 User Profile

* View and update profile
* Profile information and preferences

### 📊 Reports & Analytics

* Trip expense summaries
* Budget utilization
* Expense category analysis

---

# 🛠️ Technology Stack

## Backend

* Java
* Spring Boot
* Spring Data JPA
* Spring Security
* JWT
* Hibernate
* Maven
* PostgreSQL

## Frontend

* React
* Vite
* JavaScript
* HTML
* CSS
* Tailwind CSS
* Axios
* React Router
* Chart.js

## External Services

* Google Maps / Places / Geocoding
* OpenWeather
* Google OAuth2
* Firebase Cloud Messaging
* JavaMail

---

# 📂 Project Structure

```text
TripNest/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/tripnest/
│       └── resources/
│           └── application.properties
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── pom.xml
├── mvnw
├── mvnw.cmd
└── README.md
```

---

# 💻 Prerequisites

Install the following before running the project:

### 1. Java

Java 17 or later.

Check:

```powershell
java -version
```

### 2. Node.js

Check:

```powershell
node -v
npm -v
```

### 3. PostgreSQL

Install PostgreSQL and make sure the PostgreSQL service is running.

---

# 🗄️ Database Setup

Create a PostgreSQL database named:

```text
tripnest
```

Default development configuration:

```properties
DB_URL=jdbc:postgresql://localhost:5432/tripnest
DB_USERNAME=postgres
DB_PASSWORD=TripNest123
```

The application uses Hibernate to create/update the required tables.

> For security, production deployments should use environment variables instead of committing database passwords.

---

# 📥 Clone the Project

Clone the repository:

```powershell
git clone https://github.com/springboardmentor903/Travel-Planning-Trip-Management-Platform-Shruthi.git
```

Go into the project:

```powershell
cd Travel-Planning-Trip-Management-Platform-Shruthi
```

---

# ▶️ Run the Backend

From the project root:

```powershell
.\mvnw.cmd clean package -DskipTests
```

After a successful build, start the backend:

```powershell
java -jar ".\target\tripnest-backend-0.0.1-SNAPSHOT.jar"
```

The backend will run at:

```text
http://localhost:8080
```

### Alternative

You can run Spring Boot directly:

```powershell
.\mvnw.cmd spring-boot:run
```

---

# 🎨 Run the Frontend

Open a **second terminal**.

Go to the frontend:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

Open that address in your browser.

---

# 🔄 Running the Complete Application

You need **two terminals**.

### Terminal 1 – Backend

```powershell
cd Travel-Planning-Trip-Management-Platform-Shruthi
.\mvnw.cmd clean package -DskipTests
java -jar ".\target\tripnest-backend-0.0.1-SNAPSHOT.jar"
```

### Terminal 2 – Frontend

```powershell
cd Travel-Planning-Trip-Management-Platform-Shruthi\frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 🔑 Login

TripNest uses a **common login screen** for users.

### Administrator

```text
Email: admin@tripnest.com
Password: Admin@123
```

Normal registration creates a **Traveler** account.

> Do not expose administrator credentials in production. These credentials are intended for the current development/demo environment.

---

# ⚙️ Configuration

The backend supports environment variables for database and JWT configuration.

Example:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
```

For example, in PowerShell:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/tripnest"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your_secure_secret"
```

Then start the backend.

---

# 🌐 Running on Another Computer

After cloning the repository on another computer:

### Step 1

Install:

* Java
* Node.js
* PostgreSQL

### Step 2

Create:

```text
tripnest
```

PostgreSQL database.

### Step 3

Clone the repository:

```powershell
git clone https://github.com/springboardmentor903/Travel-Planning-Trip-Management-Platform-Shruthi.git
```

### Step 4

Start the backend:

```powershell
cd Travel-Planning-Trip-Management-Platform-Shruthi
.\mvnw.cmd clean package -DskipTests
java -jar ".\target\tripnest-backend-0.0.1-SNAPSHOT.jar"
```

### Step 5

Open another terminal and start the frontend:

```powershell
cd Travel-Planning-Trip-Management-Platform-Shruthi\frontend
npm install
npm run dev
```

### Step 6

Open:

```text
http://localhost:5173
```

The project should then run on that computer.

---

# 🐛 Troubleshooting

### Port 5173 already in use

This usually means the frontend is **already running**.

Try:

```text
http://localhost:5173
```

You don't need to start another Vite server.

---

### Port 8080 already in use

Check which process is using the port:

```powershell
netstat -ano | findstr :8080
```

---

### Maven command not recognized

Use the included Maven Wrapper instead:

```powershell
.\mvnw.cmd clean package -DskipTests
```

---

### Frontend dependencies missing

Run:

```powershell
cd frontend
npm install
npm run dev
```

---

### Database connection error

Check that:

1. PostgreSQL is installed.
2. PostgreSQL service is running.
3. Database `tripnest` exists.
4. Username and password are correct.
5. `DB_URL` points to the correct PostgreSQL instance.

---

# 🔒 Security Notes

Do not commit real production credentials, API keys, OAuth secrets, email passwords, or payment credentials to GitHub.

Use environment variables for production configuration.

---

# 👩‍💻 Development

Backend changes require rebuilding the backend:

```powershell
.\mvnw.cmd clean package -DskipTests
```

Frontend changes are automatically reflected by Vite during development.

---

# 📜 License

This project was developed as part of an internship/project development program.

---

## 👥 Project

**TripNest – Travel Planning & Trip Management Platform**

A full-stack application for planning, organizing, and managing travel experiences.
