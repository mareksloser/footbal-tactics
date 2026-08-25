# Tactical Board API Backend

A lightweight, object-oriented PHP 8.5+ backend API for a tactical board application. Designed with the **Repository Pattern** to support pluggable storage engines (JSON files, MySQL, or SQLite) without altering application or domain logic.

---

## Features

* **PHP 8.5+ OOP Architecture**: Built with strict typing (`declare(strict_types=1)`), constructor property promotion, and `readonly` classes.
* **Storage Adapter Pattern**: Seamlessly switch between local JSON file storage, MySQL, or SQLite.
* **Simple Router**: Zero external framework dependencies; handles RESTful endpoints natively.
* **PSR-4 Autoloading**: Standardized class loading via Composer.

---

## Directory Structure

```text
api-php/
├── public/
│   └── index.php             # Entry point (Front Controller)
├── src/
│   ├── Controller/           # Request controllers (Auth, Folder, Tactic)
│   ├── Exception/            # Custom application exceptions (ApiException)
│   ├── Repository/
│   │   ├── Contract/         # Repository interfaces (Adapters)
│   │   ├── Json/             # JSON file storage adapter implementations
│   │   └── Pdo/              # MySQL / SQLite PDO adapter implementations
│   └── Router.php            # HTTP router
├── storage/                  # JSON storage directory (when using JSON adapter)
├── composer.json             # PSR-4 autoloading configuration
└── README.md
```

## API Endpoints Overview

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | No | Authenticate user and receive Bearer token |
| `GET` | `/api/auth/logout` | No | Invalidate current session |
| `GET` | `/api/folders` | No | List all folders |
| `POST` | `/api/folders` | **Yes** | Create a new folder |
| `PATCH` | `/api/folders/{id}` | **Yes** | Update folder name or parent ID |
| `DELETE` | `/api/folders/{id}` | **Yes** | Delete folder |
| `GET` | `/api/tactics` | No | List all tactics (summary overview) |
| `GET` | `/api/tactics/{id}` | No | Retrieve detailed tactic content |
| `POST` | `/api/tactics` | **Yes** | Create a new tactic |
| `PUT` | `/api/tactics` | **Yes** | Update an existing tactic |
| `DELETE` | `/api/tactics/{id}` | **Yes** | Delete a tactic |
| `POST` | `/api/tactics/{id}/share` | **Yes** | Generate a public share link token |
| `GET` | `/api/shared/{token}` | No | Access a shared tactic using share token |