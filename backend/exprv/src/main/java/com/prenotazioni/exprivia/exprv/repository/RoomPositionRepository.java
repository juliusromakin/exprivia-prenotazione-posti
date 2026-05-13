package com.prenotazioni.exprivia.exprv.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.prenotazioni.exprivia.exprv.entity.RoomPosition;

public interface RoomPositionRepository extends JpaRepository<RoomPosition, Integer> {

    List<RoomPosition> findByFloorPlanId(Integer floorPlanId);
    
    Optional<RoomPosition> findByFloorPlanIdAndRoomId(Integer floorPlanId, Integer roomId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM RoomPosition rp WHERE rp.floorPlan.id = :floorPlanId")
    void deleteByFloorPlanId(@org.springframework.data.repository.query.Param("floorPlanId") Integer floorPlanId);
}
