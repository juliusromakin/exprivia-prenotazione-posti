package com.prenotazioni.exprivia.exprv.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.prenotazioni.exprivia.exprv.entity.RoomPosition;

public interface RoomPositionRepository extends JpaRepository<RoomPosition, Integer> {

    List<RoomPosition> findByFloorPlanId(Integer floorPlanId);
    
    Optional<RoomPosition> findByFloorPlanIdAndRoomId(Integer floorPlanId, Integer roomId);
}
