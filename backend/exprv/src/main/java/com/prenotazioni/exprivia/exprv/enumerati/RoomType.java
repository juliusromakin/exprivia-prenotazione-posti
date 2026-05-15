package com.prenotazioni.exprivia.exprv.enumerati;

public enum RoomType {
    MEETING_ROOM("Meeting Room"),
    OPEN_SPACE("Open Space"),
    OFFICE("Office");

    private final String label;

    RoomType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
