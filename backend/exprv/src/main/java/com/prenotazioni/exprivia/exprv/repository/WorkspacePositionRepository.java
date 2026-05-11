package com.prenotazioni.exprivia.exprv.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.prenotazioni.exprivia.exprv.entity.WorkspacePosition;

public interface WorkspacePositionRepository extends JpaRepository<WorkspacePosition, Integer> {

    List<WorkspacePosition> findByFloorPlanId(Integer floorPlanId);

    Optional<WorkspacePosition> findByFloorPlanIdAndWorkspaceId(Integer floorPlanId, Integer workspaceId);
}
