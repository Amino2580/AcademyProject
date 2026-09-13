# Academy Frontend

React and Vite frontend for the Milad Tarighat Music Academy website.

## Development

Install frontend dependencies:

```bash
npm ci
```

Run the development server:

```bash
npm run dev
```

By default, the frontend connects to:

```text
http://127.0.0.1:8000
```

To use a different backend address, create a file named `.env` inside the `frontend` directory:

```env
VITE_API_BASE_URL=https://example.com
```

## Validation

Check the frontend code:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

For backend setup, authentication, API endpoints, Docker, and complete project documentation, see the main [project README](../README.md).