package com.prenotazioni.exprivia.exprv.enumerati;

public enum AppAuthority {
    // Navigazione e viste di base
    ACTION_DASHBOARD_VIEW("Visualizzazione della dashboard principale"),

    // Prenotazioni
    ACTION_RESERVATION_CREATE_OWN("Creazione di proprie prenotazioni"),
    ACTION_RESERVATION_CREATE_ANY("Creazione di prenotazioni per qualsiasi utente"),
    ACTION_RESERVATION_READ_OWN("Visualizzazione delle proprie prenotazioni"),
    ACTION_RESERVATION_READ_ANY("Visualizzazione di tutte le prenotazioni"),
    ACTION_RESERVATION_UPDATE_OWN("Modifica delle proprie prenotazioni"),
    ACTION_RESERVATION_UPDATE_ANY("Modifica di qualsiasi prenotazione"),
    ACTION_RESERVATION_DELETE_OWN("Cancellazione delle proprie prenotazioni"),
    ACTION_RESERVATION_DELETE_ANY("Cancellazione di qualsiasi prenotazione"),
    ACTION_RESERVATION_APPROVE("Approvazione delle richieste di prenotazione"),
    ACTION_RESERVATION_EXPORT("Esportazione dei dati delle prenotazioni"),
    ACTION_MEETINGROOM_BOOK("Prenotazione di sale riunioni"),

    // Utenti
    ACTION_USER_CREATE("Creazione di nuovi utenti"),
    ACTION_USER_READ("Visualizzazione dettagli utenti"),
    ACTION_USER_UPDATE_OWN("Modifica del proprio profilo"),
    ACTION_USER_UPDATE_ANY("Modifica di qualsiasi profilo utente"),
    ACTION_USER_DELETE_OWN("Cancellazione del proprio account"),
    ACTION_USER_DELETE_ANY("Cancellazione di qualsiasi account utente"),
    ACTION_USER_APPROVE("Approvazione registrazione nuovi utenti"),

    // Planimetrie (Location, Building, Floor, Room, Workspace)
    ACTION_FLOORPLAN_CREATE("Creazione di nuove planimetrie e sedi"),
    ACTION_FLOORPLAN_READ("Visualizzazione delle planimetrie"),
    ACTION_FLOORPLAN_UPDATE("Modifica delle planimetrie esistenti"),
    ACTION_FLOORPLAN_DELETE("Cancellazione di planimetrie e sedi"),

    // Badge e Permessi HRBAC
    ACTION_BADGE_CREATE("Creazione di nuovi badge/ruoli"),
    ACTION_BADGE_READ("Visualizzazione dei badge/ruoli"),
    ACTION_BADGE_UPDATE("Modifica dei badge/ruoli"),
    ACTION_BADGE_DELETE("Cancellazione di badge/ruoli"),

    // Ruoli Base Consigliati (Questi erediteranno le varie azioni)
    ROLE_GUEST("Ruolo visitatore: permessi minimi di sola lettura"),
    ROLE_USER("Ruolo utente standard: può gestire le proprie prenotazioni"),
    ROLE_HR("Ruolo HR: gestione utenza e monitoraggio prenotazioni"),
    ROLE_MANAGER("Ruolo Manager: gestione team e approvazioni"),
    ROLE_ADMIN("Ruolo Administrator: accesso completo a tutte le funzioni");

    private final String description;

    AppAuthority(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
