package com.prenotazioni.exprivia.exprv.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.prenotazioni.exprivia.exprv.entity.WorkspacePosition;

public interface WorkspacePositionRepository extends JpaRepository<WorkspacePosition, Integer> {

    List<WorkspacePosition> findByFloorPlanId(Integer floorPlanId);

    Optional<WorkspacePosition> findByFloorPlanIdAndWorkspaceId(Integer floorPlanId, Integer workspaceId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM WorkspacePosition wp WHERE wp.floorPlan.id = :floorPlanId")
    void deleteByFloorPlanId(@org.springframework.data.repository.query.Param("floorPlanId") Integer floorPlanId);
}
