package com.prenotazioni.exprivia.exprv.dto;

public class RoomPositionDTO {
    private Integer id;
    private Integer roomId;
    private Double mapX;
    private Double mapY;
    private Double mapWidth;
    private Double mapHeight;

    public RoomPositionDTO() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getRoomId() { return roomId; }
    public void setRoomId(Integer roomId) { this.roomId = roomId; }

    public Double getMapX() { return mapX; }
    public void setMapX(Double mapX) { this.mapX = mapX; }

    public Double getMapY() { return mapY; }
    public void setMapY(Double mapY) { this.mapY = mapY; }

    public Double getMapWidth() { return mapWidth; }
    public void setMapWidth(Double mapWidth) { this.mapWidth = mapWidth; }

    public Double getMapHeight() { return mapHeight; }
    public void setMapHeight(Double mapHeight) { this.mapHeight = mapHeight; }
}
