# Legacy Email Verification Logic

This file contains the original source code for the email verification feature, preserved for future reference after switching to a manual administrator approval flow.

## 1. Entity: VerificationToken.java
```java
package com.prenotazioni.exprivia.exprv.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "verification_tokens")
public class VerificationToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, unique = true)
    private String token;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_user", nullable = false)
    private User user;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    public VerificationToken() {}

    public VerificationToken(String token, User user, LocalDateTime expiryDate) {
        this.token = token;
        this.user = user;
        this.expiryDate = expiryDate;
    }

    // Getters and Setters ...
    public int getId() { return id; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
}
```

## 2. Repository: VerificationTokenRepository.java
```java
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
```

## 3. AuthService.java (Removed Logic)

### Method: creaUtente (Verification part)
```java
        // Logic removed from creaUtente:
        // Generazione del codice di verifica (6 cifre)
        String verificationCode = String.format("%06d", new java.util.Random().nextInt(999999));
        System.out.println("DEBUG - Generazione token di verifica per " + savedUser.getEmail() + ": " + verificationCode);
        
        VerificationToken verificationToken = new VerificationToken(
            verificationCode, 
            savedUser, 
            LocalDateTime.now().plusHours(24) // Scade tra 24 ore
        );
        verificationTokenRepository.save(verificationToken);
        
        // Invio email di verifica
        emailService.sendVerificationEmail(savedUser.getEmail(), verificationCode);
```

### Method: verifyAccount
```java
    @Transactional
    public ResponseEntity<String> verifyAccount(String code) {
        Optional<VerificationToken> tokenOpt = verificationTokenRepository.findByToken(code);
        
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Codice di verifica non valido");
        }
        
        VerificationToken token = tokenOpt.get();
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(token);
            return ResponseEntity.badRequest().body("Codice di verifica scaduto");
        }
        
        User user = token.getUser();
        user.setEnabled(true);
        userRepository.save(user);
        
        verificationTokenRepository.delete(token);
        
        return ResponseEntity.ok("Account verificato con successo! Ora puoi effettuare il login.");
    }
```

## 4. AuthController.java (Removed Endpoint)
```java
    @PostMapping("/verify")
    public ResponseEntity<String> verify(@org.springframework.web.bind.annotation.RequestParam String code) {
        try {
            return authService.verifyAccount(code);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
```
