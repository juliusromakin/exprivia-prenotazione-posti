package com.prenotazioni.exprivia.exprv.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.prenotazioni.exprivia.exprv.enumerati.WorkspaceStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "workspace")
public class Workspace {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Integer id_workspace;

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
    @Column(name = "workspace_status")
    private WorkspaceStatus workspaceStatus;

    @Column(name = "is_active")
    private Boolean is_active = true;

    @ManyToOne
    @JoinColumn(name = "id_room")
    private Room room;

    @OneToMany(mappedBy = "workspace")
    @JsonIgnore
    private List<Reservation> reservations = new ArrayList<>();

    public Workspace() {
    }

    public Workspace(Integer id_workspace, String name, Integer capacity, WorkspaceStatus workspaceStatus, Room room, Boolean is_active) {
        this.id_workspace = id_workspace;
        this.name = name;
        this.capacity = capacity;
        this.workspaceStatus = workspaceStatus;
        this.room = room;
        this.is_active = is_active;
    }

    public Integer getId_workspace() {
        return id_workspace;
    }

    public void setId_workspace(Integer id_workspace) {
        this.id_workspace = id_workspace;
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

    public WorkspaceStatus getWorkspaceStatus() {
        return workspaceStatus;
    }

    public void setWorkspaceStatus(WorkspaceStatus workspaceStatus) {
        this.workspaceStatus = workspaceStatus;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public Boolean getIs_active() {
        return is_active;
    }

    public void setIs_active(Boolean is_active) {
        this.is_active = is_active;
    }

}
