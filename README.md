# Sistema di Prenotazione Postazioni - Exprivia

## Descrizione
Sistema di prenotazione postazioni di lavoro sviluppato per Exprivia. Questa applicazione permette agli utenti di gestire e prenotare le postazioni di lavoro in modo efficiente e intuitivo.

## Funzionalità Principali
- **Gestione Prenotazioni**
  - Prenotazione postazioni di lavoro
  - Visualizzazione disponibilità in tempo reale
  - Gestione fasce orarie
  - Prenotazioni singole o multiple

- **Gestione Utenti**
  - Autenticazione e autorizzazione
  - Gestione profili utente
  - Ruoli differenziati (admin/utente)
  - Gestione permessi

- **Gestione Spazi**
  - Visualizzazione mappa postazioni
  - Gestione stanze e piani
  - Stato delle postazioni in tempo reale
  - Filtri per tipo di postazione

## Tecnologie Utilizzate
### Backend
- Java Spring Boot
- Spring Security per l'autenticazione
- JPA/Hibernate per la persistenza dei dati
- PostgreSQL come database

### Frontend
- Angular 17+
- TypeScript
- TailwindCSS per lo styling
- Material Design per i componenti UI
- RxJS per la gestione dello stato

## Struttura del Progetto
```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/      # Servizi condivisi
│   │   │   └── interfaces/    # Interfacce e modelli
│   │   ├── pages/            # Componenti pagina
│   │   └── shared/           # Componenti condivisi
│   └── assets/              # Risorse statiche
└── ...

backend/
└── exprv/
    └── src/
        └── main/
            └── java/
                └── com/prenotazioni/exprivia/
                    ├── controller/  # API endpoints
                    ├── service/     # Logica di business
                    ├── model/       # Entità
                    └── dto/         # Oggetti di trasferimento dati
```

## API Endpoints Principali
- `/api/auth`: Gestione autenticazione
- `/api/prenotazioni`: Gestione prenotazioni
- `/api/postazioni`: Gestione postazioni
- `/api/stanze`: Gestione stanze
- `/api/utenti`: Gestione utenti

## Requisiti di Sistema
- Java 17+
- Node.js 18+
- PostgreSQL 15+
- Maven 3.8+

## Installazione e Configurazione

### Backend
1. Clonare il repository
```bash
git clone [url-repository]
```

2. Configurare il database PostgreSQL
```bash
# Creare un database chiamato 'dbprenotazioni'
```

3. Configurare application.properties
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/dbprenotazioni
spring.datasource.username=your_username
spring.datasource.password=your_password
```

4. Avviare il backend
```bash
cd backend/exprv
mvn spring-boot:run
```

### Frontend
1. Installare le dipendenze
```bash
cd frontend
npm install
```

2. Avviare l'applicazione
```bash
ng serve
```

## Autori
- Daniele Coppa
- Kevin Bautista
- Adriano Incognito
- Clarence Ciafardini
- Mattia Quiroz
