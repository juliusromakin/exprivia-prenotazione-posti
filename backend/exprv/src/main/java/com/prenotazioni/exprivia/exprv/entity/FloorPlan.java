package com.prenotazioni.exprivia.exprv.entity;

import java.time.LocalDate;

import java.util.List;
import java.util.ArrayList;
import jakarta.persistence.*;

@Entity
@Table(name = "floor_plan")
public class FloorPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_floor")
    private Floor floor;

    @Column(name = "name")
    private String name;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "image_path", columnDefinition = "TEXT")
    private String imagePath;

    @Column(name = "canvas_width")
    private Double canvasWidth;

    @Column(name = "canvas_height")
    private Double canvasHeight;

    @OneToMany(mappedBy = "floorPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoomPosition> roomPositions = new ArrayList<>();

    @OneToMany(mappedBy = "floorPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkspacePosition> workspacePositions = new ArrayList<>();

    public FloorPlan() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Floor getFloor() {
        return floor;
    }

    public void setFloor(Floor floor) {
        this.floor = floor;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDate validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDate getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDate validTo) {
        this.validTo = validTo;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public Double getCanvasWidth() {
        return canvasWidth;
    }

    public void setCanvasWidth(Double canvasWidth) {
        this.canvasWidth = canvasWidth;
    }

    public Double getCanvasHeight() {
        return canvasHeight;
    }

    public void setCanvasHeight(Double canvasHeight) {
        this.canvasHeight = canvasHeight;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public List<RoomPosition> getRoomPositions() {
        return roomPositions;
    }

    public void setRoomPositions(List<RoomPosition> roomPositions) {
        this.roomPositions = roomPositions;
    }

    public List<WorkspacePosition> getWorkspacePositions() {
        return workspacePositions;
    }

    public void setWorkspacePositions(List<WorkspacePosition> workspacePositions) {
        this.workspacePositions = workspacePositions;
    }
}
