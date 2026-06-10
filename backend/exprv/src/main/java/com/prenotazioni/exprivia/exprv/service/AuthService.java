package com.prenotazioni.exprivia.exprv.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prenotazioni.exprivia.exprv.dto.AdminDTO;
import com.prenotazioni.exprivia.exprv.dto.AuthResponseDTO;
import com.prenotazioni.exprivia.exprv.dto.CredentialsDto;
import com.prenotazioni.exprivia.exprv.dto.EmailDTO;
import com.prenotazioni.exprivia.exprv.dto.ResetPasswordRequest;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserSignupDTO;
import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.UserMapper;
import com.prenotazioni.exprivia.exprv.repository.BadgeRepository;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import com.prenotazioni.exprivia.exprv.security.jwt.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;

    public AuthResponseDTO login(CredentialsDto credentialsDto) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(credentialsDto.email(), credentialsDto.password()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByEmail(credentialsDto.email())
                    .orElseThrow(() -> new AppException(
                            "USER_NOT_FOUND",
                            "Utente non trovato",
                            Map.of("email", credentialsDto.email()),
                            HttpStatus.NOT_FOUND));

            String jwt = jwtTokenProvider.generateToken(authentication);

            boolean isAdmin = user.getBadges().stream()
                    .anyMatch(badge -> badge.getName().equals("ROLE_ADMIN"));

            if (isAdmin) {
                AdminDTO adminDTO = userMapper.toAdminDto(user);
                return AuthResponseDTO.forAdmin(jwt, adminDTO);
            } else {
                UserDTO userDTO = userMapper.toDto(user);
                return AuthResponseDTO.forUser(jwt, userDTO);
            }
        } catch (BadCredentialsException e) {
            throw new AppException("INVALID_CREDENTIALS", "Credenziali non valide", HttpStatus.BAD_REQUEST);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(
                    "AUTHENTICATION_ERROR",
                    "Errore durante l'autenticazione: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> forgotPassword(EmailDTO emailDTO) {
        if (emailDTO.email() == null || emailDTO.email().isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "L'email è obbligatoria"));
        }

        String email = emailDTO.email().trim();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of("message", "Email non trovata nel sistema"));
        }

        try {
            String token = passwordResetService.createResetToken(email);
            emailService.sendPasswordResetEmail(email, token);
            return ResponseEntity.ok(java.util.Map.of("message", "Email inviata, controlla la tua posta elettronica"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("message", "Errore durante l'invio dell'email"));
        }
    }

    @Transactional
    public ResponseEntity<?> resetPassword(ResetPasswordRequest resetRequest) {
        if (resetRequest.token() == null || resetRequest.newPassword() == null
                || resetRequest.newPassword().isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Dati mancanti per il reset"));
        }

        Optional<User> userOpt = passwordResetService.validateToken(resetRequest.token());

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Token non valido o scaduto"));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(resetRequest.newPassword()));
        userRepository.save(user);

        passwordResetService.invalidateToken(resetRequest.token());

        return ResponseEntity.ok(java.util.Map.of("message", "Password aggiornata con successo"));
    }

    @Transactional
    public UserDTO creaUtente(UserSignupDTO registrationDTO) {
        validateRegistrationData(registrationDTO);

        if (userRepository.findByEmail(registrationDTO.getEmail()).isPresent()) {
            throw new AppException(
                    "EMAIL_ALREADY_IN_USE",
                    "Esiste già un utente con questa email!",
                    Map.of("email", registrationDTO.getEmail()),
                    HttpStatus.BAD_REQUEST);
        }

        User user = userMapper.toEntity(registrationDTO);
        user.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
        user.setEnabled(true); 

        Badge guestBadge = badgeRepository.findByName("ROLE_GUEST")
                .orElseThrow(() -> new AppException(
                        "ROLE_GUEST_NOT_FOUND",
                        "Badge ROLE_GUEST non trovato nel sistema",
                        HttpStatus.INTERNAL_SERVER_ERROR));

        Set<Badge> badges = new HashSet<>();
        badges.add(guestBadge);
        user.setBadges(badges);

        User savedUser = userRepository.save(user);
        return userMapper.toDto(savedUser);
    }

    private void validateRegistrationData(UserSignupDTO registrationDTO) {
        if (registrationDTO.getName() == null || registrationDTO.getName().isBlank())
            throw new AppException("NAME_REQUIRED", "Il nome non può essere vuoto", HttpStatus.BAD_REQUEST);
        if (registrationDTO.getLastName() == null || registrationDTO.getLastName().isBlank())
            throw new AppException("LAST_NAME_REQUIRED", "Il cognome non può essere vuoto", HttpStatus.BAD_REQUEST);
        if (registrationDTO.getEmail() == null || registrationDTO.getEmail().isBlank())
            throw new AppException("EMAIL_REQUIRED", "La mail non può essere vuota", HttpStatus.BAD_REQUEST);
        if (registrationDTO.getPassword() == null || registrationDTO.getPassword().length() < 6)
            throw new AppException(
                    "PASSWORD_TOO_SHORT",
                    "La password deve contenere almeno 6 caratteri",
                    Map.of("minLength", 6),
                    HttpStatus.BAD_REQUEST);
    }

}