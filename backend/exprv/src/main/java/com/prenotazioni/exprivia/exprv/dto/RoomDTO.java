package com.prenotazioni.exprivia.exprv.dto;

import com.prenotazioni.exprivia.exprv.enumerati.RoomType;

public class RoomDTO {
    private Integer id;
    private String name;
    private RoomType roomType;
    private Integer capacity;
    private Boolean enabled;
    private Integer floorId;
    private Double mapX;
    private Double mapY;
    private Double mapWidth;
    private Double mapHeight;

    public RoomDTO() {
    }

    public RoomDTO(Integer id, String name, RoomType roomType, Integer capacity, Boolean enabled, Integer floorId,
            Double mapX, Double mapY, Double mapWidth, Double mapHeight) {
        this.id = id;
        this.name = name;
        this.roomType = roomType;
        this.capacity = capacity;
        this.enabled = enabled;
        this.floorId = floorId;
        this.mapX = mapX;
        this.mapY = mapY;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
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

    public Integer getFloorId() {
        return floorId;
    }

    public void setFloorId(Integer floorId) {
        this.floorId = floorId;
    }

    public Double getMapX() {
        return mapX;
    }

    public void setMapX(Double mapX) {
        this.mapX = mapX;
    }

    public Double getMapY() {
        return mapY;
    }

    public void setMapY(Double mapY) {
        this.mapY = mapY;
    }

    public Double getMapWidth() {
        return mapWidth;
    }

    public void setMapWidth(Double mapWidth) {
        this.mapWidth = mapWidth;
    }

    public Double getMapHeight() {
        return mapHeight;
    }

    public void setMapHeight(Double mapHeight) {
        this.mapHeight = mapHeight;
    }

}
