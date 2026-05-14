package com.prenotazioni.exprivia.exprv.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.prenotazioni.exprivia.exprv.enumerati.WorkspaceStatus;

import jakarta.persistence.*;

@Entity
@Table(name = "workspace")
public class Workspace {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private Integer id;

    @Column(name = "name")
    private String name;

    @Column(name = "capacity")
    private Integer capacity;

    @CreationTimestamp
    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @UpdateTimestamp
    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private WorkspaceStatus status;

    @Column(name = "enabled")
    private Boolean enabled = true;

    @ManyToOne
    @JoinColumn(name = "id_room")
    private Room room;

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<WorkspacePosition> workspacePositions = new ArrayList<>();



    public Workspace() {
    }

    public Workspace(Integer id, String name, Integer capacity,
            WorkspaceStatus status, Boolean enabled, Room room, List<Reservation> reservations) {
        this.id = id;
        this.name = name;
        this.capacity = capacity;
        this.status = status;
        this.enabled = enabled;
        this.room = room;
        this.reservations = reservations;
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

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public LocalDateTime getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(LocalDateTime updatedDate) {
        this.updatedDate = updatedDate;
    }

    public WorkspaceStatus getStatus() {
        return status;
    }

    public void setStatus(WorkspaceStatus status) {
        this.status = status;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public List<Reservation> getReservations() {
        return reservations;
    }

    public void setReservations(List<Reservation> reservations) {
        this.reservations = reservations;
    }

    public List<WorkspacePosition> getWorkspacePositions() {
        return workspacePositions;
    }

    public void setWorkspacePositions(List<WorkspacePosition> workspacePositions) {
        this.workspacePositions = workspacePositions;
    }



}
