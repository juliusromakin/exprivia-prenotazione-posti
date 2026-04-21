package com.prenotazioni.exprivia.exprv.repository;

import org.springframework.stereotype.Repository;
import com.prenotazioni.exprivia.exprv.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

@Repository
public interface LocationRepository extends JpaRepository<Location, Integer> {

}
