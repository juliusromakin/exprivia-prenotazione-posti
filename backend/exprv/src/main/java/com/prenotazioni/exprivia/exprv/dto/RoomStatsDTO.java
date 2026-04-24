package com.prenotazioni.exprivia.exprv.dto;

public class RoomStatsDTO {
    private String roomName;
    private Long reservationCount;

    public RoomStatsDTO(String roomName, Long reservationCount) {
        this.roomName = roomName;
        this.reservationCount = reservationCount;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public Long getReservationCount() {
        return reservationCount;
    }

    public void setReservationCount(Long reservationCount) {
        this.reservationCount = reservationCount;
    }
}
