package com.prenotazioni.exprivia.exprv.repository;

import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Integer> {

    Optional<VerificationToken> findByToken(String token);

    Optional<VerificationToken> findByUser(User user);
    
    void deleteByUser(User user);
}
