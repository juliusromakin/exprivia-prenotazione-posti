package com.prenotazioni.exprivia.exprv.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.FloorPlan;

@Repository
public interface FloorPlanRepository extends JpaRepository<FloorPlan, Integer> {
    Optional<FloorPlan> findByFloorId(Integer floorId);
}
