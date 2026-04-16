package com.prenotazioni.exprivia.exprv.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.AdminDTO;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserUpdateDTO;
import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.mapper.UserMapper;
import com.prenotazioni.exprivia.exprv.repository.AuthorityRepository;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import com.prenotazioni.exprivia.exprv.security.jwt.JwtTokenProvider;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.security.access.AccessDeniedException;

@Service
@Transactional
public class UserService {

    private UserRepository userRepository; // Repo User
    private AuthorityRepository authorityRepository;
    private PasswordEncoder passwordEncoder;
    private UserMapper userMapper; // User Mapper

    public UserService(UserRepository userRepository, AuthorityRepository authorityRepository,
            PasswordEncoder passwordEncoder, UserMapper userMapper,
            JwtTokenProvider jwtTokenProvider, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
        this.authorityRepository = authorityRepository;
    }

    /**
     * Recupera tutti gli utenti dal database come AdminDTO (per utenti con
     * ruolo ADMIN)
     *
     * @return Lista di AdminDTO
     */
    public List<AdminDTO> cercaTutti() {
        List<User> usersList = userRepository.findAll();
        return userMapper.toAdminDtoList(usersList);
    }

    /**
     * Recupera un utente con l'id come AdminDTO (per utenti con ruolo ADMIN)
     *
     * @return AdminDTO
     */
    public AdminDTO cercaSingolo(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utente con id " + id + " non trovato"));
        return new AdminDTO(user);
    }

    /**
     * Recupera un utente tramite email come AdminDTO (per utenti con ruolo
     * ADMIN)
     *
     * @return AdminDTO
     */
    public AdminDTO cercaPerEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utente con email " + email + " non trovato"));
        return new AdminDTO(user);
    }

    public Authority getAuthorityByName(String name) {
        return authorityRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Authority not found with name: " + name));
    }

    /**
     * Aggiorna un utente con i dati forniti
     *
     * @param id        ID dell'utente da aggiornare
     * @param updateDTO DTO con i dati da aggiornare
     * @return UserDTO dell'utente aggiornato
     * @throws EntityNotFoundException  se l'utente non esiste
     * @throws IllegalArgumentException se i dati forniti non sono validi
     */
    public UserDTO updateUser(Integer id, UserUpdateDTO updateDTO) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utente con ID " + id + " non trovato"));

        // Verifica email duplicata
        if (updateDTO.getEmail() != null) {
            Optional<User> userWithSameEmail = userRepository.findByEmail(updateDTO.getEmail());
            if (userWithSameEmail.isPresent() && !userWithSameEmail.get().getId_user().equals(id)) {
                throw new IllegalArgumentException("Email già in uso");
            }
        }

        // Verifica password se si tenta di cambiarla
        if (updateDTO.getNewPassword() != null && !updateDTO.getNewPassword().trim().isEmpty()) {
            String currentPassword = updateDTO.getCurrentPassword();

            if (currentPassword == null || currentPassword.trim().isEmpty()) {
                throw new IllegalArgumentException("La password attuale è richiesta per modificare la password");
            }

            // Verifica che la password attuale corrisponda a quella nel database
            if (!passwordEncoder.matches(currentPassword, existingUser.getPassword())) {
                throw new IllegalArgumentException("Password attuale non corretta");
            }

            // Imposta la nuova password cifrata
            existingUser.setPassword(passwordEncoder.encode(updateDTO.getNewPassword()));
        }

        // Usa il mapper per gli altri campi generici
        userMapper.updateEntityFromUserUpdateDto(updateDTO, existingUser);

        existingUser.setUpdatedDate(LocalDateTime.now());
        User updatedUser = userRepository.save(existingUser);
        return userMapper.toDto(updatedUser);
    }

    /**
     * Elimina un utente dal sistema
     *
     * @param id ID dell'utente da eliminare
     * @throws EntityNotFoundException se l'utente non esiste
     */
    public void eliminaUser(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("Utente con ID " + id + " non trovato");
        }
        userRepository.deleteById(id);
    }

    /**
     * Elimina l'account personale dell'utente autenticato
     *
     * @param email Email dell'utente da eliminare
     * @throws EntityNotFoundException se l'utente non esiste
     * @throws AccessDeniedException   se l'utente non ha i permessi necessari
     */
    public void eliminaAccountPersonale(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utente non trovato"));

        // Verifica che l'utente stia eliminando il proprio account
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!email.equals(authentication.getName())) {
            throw new AccessDeniedException("Non hai il permesso di eliminare questo account");
        }

        userRepository.delete(user);
    }

    public UserDetails loadUserByUsername(String email) {
        throw new UnsupportedOperationException("Unimplemented method 'loadUserByUsername'");
    }

    public UserDTO getDetailsForAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utente con email " + email + " non trovato"));

        return userMapper.toDto(user);
    }

    public UserDTO findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utente con email " + email + " non trovato"));
        return userMapper.toDto(user);
    }

}
