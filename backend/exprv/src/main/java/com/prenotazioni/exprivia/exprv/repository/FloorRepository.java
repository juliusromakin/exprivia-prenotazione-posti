package com.prenotazioni.exprivia.exprv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.prenotazioni.exprivia.exprv.entity.Floor;
import java.util.List;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Integer> {

    List<Floor> findByBuildingId(Integer buildingId);
    
    List<Floor> findByBuildingIdAndEnabledTrue(Integer buildingId);
    
    List<Floor> findAllByEnabledTrue();

}
