package com.prenotazioni.exprivia.exprv.repository;

import com.prenotazioni.exprivia.exprv.entity.StatoPostazione;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StatoPostazioneRepository extends JpaRepository<StatoPostazione, String> {
}
