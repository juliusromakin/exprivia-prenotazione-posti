package com.prenotazioni.exprivia.exprv.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;

@Entity
@Table(name = "floor")
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name")
    private String name;

    @CreationTimestamp
    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate;

    @UpdateTimestamp
    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @ManyToOne
    @JoinColumn(name = "id_building")
    private Building building;

    @Column(name = "enabled")
    private Boolean enabled = true;

    @Column(name = "image_path")
    private String imagePath;

    @Column(name = "canvas_width")
    private Double canvasWidth;

    @Column(name = "canvas_height")
    private Double canvasHeight;

    @OneToMany(mappedBy = "floor")
    @JsonIgnore
    private List<Room> rooms = new ArrayList<>();

    public Floor() {
    }

    public Floor(Integer id, String name, Building building, List<Room> rooms) {
        this.id = id;
        this.name = name;
        this.building = building;
        this.rooms = rooms;
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

    public Building getBuilding() {
        return building;
    }

    public void setBuilding(Building building) {
        this.building = building;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
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

    public List<Room> getRooms() {
        return rooms;
    }

    public void setRooms(List<Room> rooms) {
        this.rooms = rooms;
    }
}