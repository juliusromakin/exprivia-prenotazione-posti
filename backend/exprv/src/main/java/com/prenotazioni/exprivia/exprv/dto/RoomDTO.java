package com.prenotazioni.exprivia.exprv.dto;

import com.prenotazioni.exprivia.exprv.enumerati.RoomType;

public class RoomDTO {
    private Integer id;
    private String name;
    private RoomType roomType;
    private Integer capacity;
    private Boolean enabled;

    public RoomDTO() {
    }

    public RoomDTO(Integer id, String name, RoomType roomType, Integer capacity, Boolean enabled) {
        this.id = id;
        this.name = name;
        this.roomType = roomType;
        this.capacity = capacity;
        this.enabled = enabled;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public RoomType getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomType roomType) {
        this.roomType = roomType;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

}
