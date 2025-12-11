# Contributing to SentinelShare

Thank you for your interest in contributing to SentinelShare! We welcome contributions from the community to help improve this project.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/SentinelShare.git
    cd SentinelShare
    ```
3.  **Create a new branch** for your feature or fix:
    ```bash
    git checkout -b feature/my-new-feature
    ```

## Development Setup

### Backend (Python/FastAPI)

1.  Navigate to the `backend` directory (or root, depending on structure).
2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the server (dev mode):
    ```bash
    uvicorn backend.main:app --reload
    ```

### Frontend (Svelte/Vite)

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## Development Guidelines

- **Code Style**: Please follow the existing code style.
  - Python: PEP 8 recommended.
  - Frontend: Prettier/ESLint usage is encouraged.
- **Testing**: Add tests for new features where possible.
  - Backend tests: `pytest`
  - Frontend tests: `npm test` (if configured)
- **Commits**: Write clear, descriptive commit messages.

## Submitting a Pull Request

1.  Push your changes to your fork.
2.  Open a Pull Request against the `main` branch of this repository.
3.  Describe your changes in detail and link to any relevant issues.

## Reporting Issues

If you find a bug or have a feature request, please open an issue in the GitHub repository. Provide as much detail as possible to help us understand and resolve the problem.

---

Copyright (c) 2025 f4tdaddy
