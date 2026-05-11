package com.prenotazioni.exprivia.exprv.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_position")
public class RoomPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_floor_plan")
    private FloorPlan floorPlan;

    @ManyToOne
    @JoinColumn(name = "id_room")
    private Room room;

    @Column(name = "map_x")
    private Double mapX;

    @Column(name = "map_y")
    private Double mapY;

    @Column(name = "map_width")
    private Double mapWidth;

    @Column(name = "map_height")
    private Double mapHeight;

    public RoomPosition() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public FloorPlan getFloorPlan() {
        return floorPlan;
    }

    public void setFloorPlan(FloorPlan floorPlan) {
        this.floorPlan = floorPlan;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
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
