package com.prenotazioni.exprivia.exprv.integration.api.v1.dto;

import java.util.List;

public class MeetingRoomOccupancyDTO {
    private Integer roomId;
    private String roomName;
    private Boolean currentlyOccupied;
    private List<OccupancySlotDTO> occupancySlots;

    public MeetingRoomOccupancyDTO() {
    }

    public MeetingRoomOccupancyDTO(Integer roomId, String roomName, Boolean currentlyOccupied, List<OccupancySlotDTO> occupancySlots) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.currentlyOccupied = currentlyOccupied;
        this.occupancySlots = occupancySlots;
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public Boolean getCurrentlyOccupied() {
        return currentlyOccupied;
    }

    public void setCurrentlyOccupied(Boolean currentlyOccupied) {
        this.currentlyOccupied = currentlyOccupied;
    }

    public List<OccupancySlotDTO> getOccupancySlots() {
        return occupancySlots;
    }

    public void setOccupancySlots(List<OccupancySlotDTO> occupancySlots) {
        this.occupancySlots = occupancySlots;
    }
}
