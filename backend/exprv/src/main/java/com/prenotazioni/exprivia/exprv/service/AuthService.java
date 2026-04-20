package com.prenotazioni.exprivia.exprv.service;

import java.time.LocalDateTime;
import java.util.HashSet;
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
import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.entity.VerificationToken;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.UserMapper;
import com.prenotazioni.exprivia.exprv.repository.AuthorityRepository;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import com.prenotazioni.exprivia.exprv.repository.VerificationTokenRepository;
import com.prenotazioni.exprivia.exprv.security.jwt.JwtTokenProvider;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AuthorityRepository authorityRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;
    private final VerificationTokenRepository verificationTokenRepository;

    public AuthService(UserRepository userRepository, AuthorityRepository authorityRepository,
            PasswordEncoder passwordEncoder, UserMapper userMapper, JwtTokenProvider jwtTokenProvider,
            AuthenticationManager authenticationManager, PasswordResetService passwordResetService,
            EmailService emailService, VerificationTokenRepository verificationTokenRepository) {
        this.userRepository = userRepository;
        this.authorityRepository = authorityRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
        this.passwordResetService = passwordResetService;
        this.emailService = emailService;
        this.verificationTokenRepository = verificationTokenRepository;
    }

    public AuthResponseDTO login(CredentialsDto credentialsDto) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(credentialsDto.email(), credentialsDto.password()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByEmail(credentialsDto.email())
                    .orElseThrow(() -> new AppException("Utente non trovato", HttpStatus.NOT_FOUND));

            String jwt = jwtTokenProvider.generateToken(authentication);

            boolean isAdmin = user.getAuthorities().stream()
                    .anyMatch(auth -> auth.getName().equals("ROLE_ADMIN"));

            if (isAdmin) {
                AdminDTO adminDTO = userMapper.toAdminDto(user);
                return AuthResponseDTO.forAdmin(jwt, adminDTO);
            } else {
                UserDTO userDTO = userMapper.toDto(user);
                return AuthResponseDTO.forUser(jwt, userDTO);
            }
        } catch (BadCredentialsException e) {
            throw new AppException("Credenziali non valide", HttpStatus.BAD_REQUEST);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException("Errore durante l'autenticazione: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<String> forgotPassword(EmailDTO emailDTO) {
        if (emailDTO.email() == null || emailDTO.email().isBlank()) {
            return ResponseEntity.badRequest().body("L'email è obbligatoria");
        }

        String email = emailDTO.email().trim();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email non trovata nel sistema");
        }

        try {
            String token = passwordResetService.createResetToken(email);
            emailService.sendPasswordResetEmail(email, token);
            return ResponseEntity.ok("Email inviata, controlla la tua posta elettronica");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Errore durante l'invio dell'email");
        }
    }

    @Transactional
    public ResponseEntity<String> resetPassword(ResetPasswordRequest resetRequest) {
        if (resetRequest.token() == null || resetRequest.newPassword() == null
                || resetRequest.newPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Dati mancanti per il reset");
        }

        Optional<User> userOpt = passwordResetService.validateToken(resetRequest.token());

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Token non valido o scaduto");
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(resetRequest.newPassword()));
        userRepository.save(user);

        passwordResetService.invalidateToken(resetRequest.token());

        return ResponseEntity.ok("Password aggiornata con successo");
    }

    @Transactional
    public UserDTO creaUtente(UserSignupDTO registrationDTO) {
        validateRegistrationData(registrationDTO);

        if (userRepository.findByEmail(registrationDTO.getEmail()).isPresent()) {
            throw new AppException("Esiste già un utente con questa email!", HttpStatus.BAD_REQUEST);
        }

        // Il Mapper ignorerà le authorities e la password per questioni di sicurezza, e
        // is_active
        User user = userMapper.toEntity(registrationDTO);

        // Impostiamo noi i dati sensibili in sicurezza!
        user.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
        user.setEnabled(false); // L'utente non è attivo finché non verifica l'email!

        Authority userAuthority = authorityRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new AppException("Ruolo ROLE_USER non trovato nel sistema",
                        HttpStatus.INTERNAL_SERVER_ERROR));

        Set<Authority> authorities = new HashSet<>();
        authorities.add(userAuthority);
        user.setAuthorities(authorities);

        User savedUser = userRepository.save(user);
        
        // Generazione del codice di verifica (6 cifre)
        String verificationCode = String.format("%06d", new java.util.Random().nextInt(999999));
        VerificationToken verificationToken = new VerificationToken(
            verificationCode, 
            savedUser, 
            LocalDateTime.now().plusHours(24) // Scade tra 24 ore
        );
        verificationTokenRepository.save(verificationToken);
        
        // Invio email di verifica
        emailService.sendVerificationEmail(savedUser.getEmail(), verificationCode);

        return userMapper.toDto(savedUser);
    }

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

    private void validateRegistrationData(UserSignupDTO registrationDTO) {
        if (registrationDTO.getName() == null || registrationDTO.getName().isBlank())
            throw new AppException("Il nome non può essere vuoto", HttpStatus.BAD_REQUEST);
        if (registrationDTO.getLastName() == null || registrationDTO.getLastName().isBlank())
            throw new AppException("Il cognome non può essere vuoto", HttpStatus.BAD_REQUEST);
        if (registrationDTO.getEmail() == null || registrationDTO.getEmail().isBlank())
            throw new AppException("La mail non può essere vuota", HttpStatus.BAD_REQUEST);
        if (registrationDTO.getPassword() == null || registrationDTO.getPassword().length() < 6)
            throw new AppException("La password deve contenere almeno 6 caratteri", HttpStatus.BAD_REQUEST);
    }

}