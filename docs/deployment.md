# Deployment and Analytics

## Docker

Build and start the editor container:

```bash
docker-compose build
docker-compose up
```

The editor is available at `http://localhost:80`.

## Plausible Analytics

Plausible Analytics is optional. Configure `plausible-conf.env` with a random `SECRET_KEY` and the production `BASE_URL`. Configure the web app with:

```bash
VITE_PLAUSIBLE_DOMAIN=your-domain.com
VITE_PLAUSIBLE_URL=http://localhost:8002
```

Start the analytics services:

```bash
docker compose -f docker-compose.plausible.yml up -d
```

Access the dashboard at `http://localhost:8002`. For production, set `DISABLE_REGISTRATION=true`, configure SMTP if password resets are needed, and serve Plausible through an SSL-enabled reverse proxy.

## VPS deployment

Create `.env` from `.env.example` with:

```bash
VPS_USER=your_username
VPS_HOST=your_vps_ip_or_domain
VPS_PATH=/opt/transit-editor
```

Deploy with:

```bash
chmod +x deploy.sh
./deploy.sh
```

The script synchronizes project files, builds the Docker image on the VPS, and restarts the containers.

## Node version

The project requires Node 24. Use the version in `.nvmrc`:

```bash
nvm use
```
