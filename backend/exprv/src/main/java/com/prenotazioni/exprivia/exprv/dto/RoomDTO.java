package com.prenotazioni.exprivia.exprv.dto;

import com.prenotazioni.exprivia.exprv.enumerati.RoomType;

public class RoomDTO {
    private Integer id_room;
    private String name;
    private RoomType room_type;
    private Integer capacity;
    private Boolean is_active;

    public RoomDTO() {
    }

    public RoomDTO(Integer id_room, String name, RoomType room_type, Integer capacity, Boolean is_active) {
        this.id_room = id_room;
        this.name = name;
        this.room_type = room_type;
        this.capacity = capacity;
        this.is_active = is_active;
    }

    public Integer getId_room() {
        return id_room;
    }

    public void setId_room(Integer id_room) {
        this.id_room = id_room;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public RoomType getRoom_type() {
        return room_type;
    }

    public void setRoom_type(RoomType room_type) {
        this.room_type = room_type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Boolean getIs_active() {
        return is_active;
    }

    public void setIs_active(Boolean is_active) {
        this.is_active = is_active;
    }

}
