# 🎰 Szybki Start - Casino Docker

## Przed uruchomieniem

1. Upewnij się, że masz zainstalowany Docker i Docker Compose
2. Plik `.env` jest już skonfigurowany z bazą AWS RDS

## Uruchomienie w 60 sekund

### Opcja 1: Development (z lokalną bazą)
```bash
# Nadaj uprawnienia skryptowi deploy (tylko raz)
chmod +x deploy.sh

# Uruchom aplikację
./deploy.sh deploy dev

# Lub alternatywnie
make up
# Lub
docker-compose up -d
```

### Opcja 2: Production (z AWS RDS)
```bash
# Uruchom aplikację w trybie produkcyjnym
./deploy.sh deploy prod

# Lub alternatywnie
make prod
# Lub
docker-compose -f docker-compose.prod.yml up -d
```

## Sprawdzenie czy działa

Po uruchomieniu sprawdź:

- **Aplikacja**: http://localhost:3000
- **Pierwsza strona**: http://localhost:3000/web  
- **API status**: http://localhost:3000/ (powinno zwrócić {"message": "Hello World"})

## Podstawowe komendy

```bash
# Status kontenerów
docker-compose ps

# Logi aplikacji
docker-compose logs -f app

# Zatrzymaj
docker-compose down

# Restart
docker-compose restart app
```

## Troubleshooting

### Port 3000 zajęty?
```bash
# Zmień port w docker-compose.yml
ports:
  - "3001:3000"  # localhost:3001 -> container:3000
```

### Problemy z bazą?
```bash
# Sprawdź logi PostgreSQL
docker-compose logs postgres

# Podłącz się do bazy
docker-compose exec postgres psql -U postgres -d wirtualnekasyno
```

### Rebuild od zera
```bash
# Wyczyść wszystko i zbuduj ponownie
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

## Przydatne polecenia

```bash
# Wejdź do kontenera aplikacji
docker-compose exec app sh

# Sprawdź utilization zasobów
docker stats

# Backup bazy danych
make backup
```

## Pliki Docker

- `Dockerfile` - Obraz aplikacji
- `docker-compose.yml` - Development setup
- `docker-compose.prod.yml` - Production setup  
- `deploy.sh` - Skrypt wdrożeniowy
- `Makefile` - Szybkie komendy
- `nginx.conf` - Konfiguracja reverse proxy