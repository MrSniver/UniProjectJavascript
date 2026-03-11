# Docker Setup - Wirtualne Kasyno

Kompletna konfiguracja Docker dla aplikacji kasyna hazardowego.

## Struktura plików Docker

- `Dockerfile` - Główny obraz aplikacji Node.js
- `docker-compose.yml` - Konfiguracja dla development (z lokalną bazą PostgreSQL)
- `docker-compose.prod.yml` - Konfiguracja produkcyjna (z AWS RDS)
- `.dockerignore` - Wykluczenie plików z obrazu Docker
- `nginx.conf` - Konfiguracja reverse proxy dla produkcji

## Szybki Start

### Rozwój lokalny (z lokalną bazą PostgreSQL)

```bash
# Zbuduj i uruchom aplikację z lokalną bazą
docker-compose up -d

# Sprawdź logi
docker-compose logs -f app

# Zatrzymaj aplikację
docker-compose down
```

### Produkcja (z AWS RDS)

```bash
# Uruchom w trybie produkcyjnym z AWS RDS
docker-compose -f docker-compose.prod.yml up -d

# Sprawdź status
docker-compose -f docker-compose.prod.yml ps

# Zatrzymaj
docker-compose -f docker-compose.prod.yml down
```

## Dostępne endpointy

Po uruchomieniu aplikacja będzie dostępna pod:

- **Aplikacja główna**: http://localhost:3000
- **Panel administracyjny**: http://localhost:3000/web
- **API**: http://localhost:3000/api/*
- **Adminer** (tylko dev): http://localhost:8080 (dla zarządzania bazą)
- **Nginx** (tylko prod): http://localhost:80

## Konfiguracja środowiskowa

Plik `.env` zawiera już wszystkie potrzebne zmienne:

```bash
# Baza danych AWS RDS
DB_HOST=wirtualnekasyno.c1ymiamg89sf.eu-north-1.rds.amazonaws.com
DB_USER=postgres
DB_PASSWORD=Ar0n1234
DB_NAME=wirtualnekasyno
DB_PORT=5432

# JWT Configuration
ACCESS_SECRET=...
REFRESH_SECRET=...
```

## Dostępne komendy

### Zarządzanie kontenerami

```bash
# Uruchom w tle
docker-compose up -d

# Uruchom z logami na żywo
docker-compose up

# Zatrzymaj i usuń kontenery
docker-compose down

# Zatrzymaj, usuń kontenery i volumes
docker-compose down -v

# Przebuduj obrazy
docker-compose build

# Sprawdź status kontenerów
docker-compose ps

# Zobacz logi aplikacji
docker-compose logs app

# Wejdź do kontenera aplikacji
docker-compose exec app sh
```

### Zarządzanie bazą danych (tryb development)

```bash
# Sprawdź logi PostgreSQL
docker-compose logs postgres

# Połącz się z bazą danych
docker-compose exec postgres psql -U postgres -d wirtualnekasyno

# Backup bazy danych
docker-compose exec postgres pg_dump -U postgres wirtualnekasyno > backup.sql

# Restore bazy danych
docker-compose exec -T postgres psql -U postgres -d wirtualnekasyno < backup.sql
```

## Monitoring i debugowanie

### Health Check

Aplikacja ma skonfigurowany health check:

```bash
# Sprawdź status health check
docker inspect --format='{{.State.Health.Status}}' container_name
```

### Logi

```bash
# Wszystkie logi
docker-compose logs

# Tylko aplikacja
docker-compose logs app

# Live logs
docker-compose logs -f app

# Ostatnie 100 linii
docker-compose logs --tail=100 app
```

### Metryki

```bash
# Użycie zasobów
docker stats

# Szczegóły kontenera
docker inspect container_name
```

## Bezpieczeństwo

### Konfiguracja Nginx (produkcja)

- Rate limiting dla API (10 requests/s)
- Rate limiting dla logowania (5 requests/min)
- Security headers (HSTS, XSS Protection, etc.)
- Proxy headers dla właściwego logowania IP

### Kontener aplikacji

- Uruchomiony jako non-root user
- Alpine Linux dla mniejszego obrazu
- Health check monitoring
- Czyszczenie cache npm

## Troubleshooting

### Problem z połączeniem do bazy

```bash
# Sprawdź czy baza jest dostępna
docker-compose exec app node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  process.exit();
});
"
```

### Problem z portami

```bash
# Sprawdź które porty są zajęte
netstat -tulpn | grep :3000

# Zmień port w docker-compose.yml jeśli potrzeba
ports:
  - "3001:3000"  # host:container
```

### Problemy z buildem

```bash
# Wyczyść wszystko i zbuduj od nowa
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
docker-compose up
```

## Skalowanie

### Uruchomienie wielu instancji

```bash
# Uruchom 3 instancje aplikacji
docker-compose up --scale app=3
```

### Load balancing przez nginx

W produkcji nginx automatycznie rozdziela ruch między dostępne instancje.

## Backup i restore

### Backup kompletny

```bash
# Backup danych aplikacji
docker run --rm -v $(pwd):/backup -v casino_postgres_data:/data alpine tar czf /backup/postgres_backup.tar.gz /data

# Backup plików aplikacji
tar czf app_backup.tar.gz Frontend/ uploads/ logs/
```

### Restore

```bash
# Restore PostgreSQL data
docker run --rm -v $(pwd):/backup -v casino_postgres_data:/data alpine tar xzf /backup/postgres_backup.tar.gz -C /
```