package com.prenotazioni.exprivia.exprv.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.PasswordResetToken;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {

    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUser(com.prenotazioni.exprivia.exprv.entity.User user);
    void deleteByUser(com.prenotazioni.exprivia.exprv.entity.User user);
}
