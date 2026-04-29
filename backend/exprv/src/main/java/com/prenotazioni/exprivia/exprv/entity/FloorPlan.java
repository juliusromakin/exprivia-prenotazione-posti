package com.prenotazioni.exprivia.exprv.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "floor_plan")
public class FloorPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "id_floor", unique = true)
    private Floor floor;

    @Column(name = "image_path")
    private String imagePath;

    @Column(name = "canvas_width")
    private Double canvasWidth;

    @Column(name = "canvas_height")
    private Double canvasHeight;

    @UpdateTimestamp
    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    public FloorPlan() {
    }

    public FloorPlan(Floor floor, String imagePath, Double canvasWidth, Double canvasHeight) {
        this.floor = floor;
        this.imagePath = imagePath;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
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

    public LocalDateTime getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(LocalDateTime updatedDate) {
        this.updatedDate = updatedDate;
    }
}
