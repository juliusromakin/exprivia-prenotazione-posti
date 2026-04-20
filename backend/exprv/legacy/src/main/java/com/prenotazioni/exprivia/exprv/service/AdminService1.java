package com.prenotazioni.exprivia.exprv.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.AdminCreateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminUpdateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.mapper.UserMapper;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class AdminService1 {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public AdminService1(UserRepository userRepository, UserMapper userMapper,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    private void validateUserData(AdminCreateUserDTO adminCreateUserDTO) {
        if (adminCreateUserDTO.getName() == null || adminCreateUserDTO.getName().isEmpty()) {
            throw new IllegalArgumentException("Il nome non può essere nullo!");
        }
        if (adminCreateUserDTO.getLastName() == null || adminCreateUserDTO.getLastName().isEmpty()) {
            throw new IllegalArgumentException("Il cognome non può essere nullo!");
        }
        if (adminCreateUserDTO.getEmail() == null || adminCreateUserDTO.getEmail().isEmpty()) {
            throw new IllegalArgumentException("La mail non può essere nulla!");
        }
    }

    public UserDTO creaUtenteAdmin(AdminCreateUserDTO adminCreateUserDTO) {
        validateUserData(adminCreateUserDTO);

        if (userRepository.findByEmail(adminCreateUserDTO.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Esiste già un utente con questa email!");
        }

        if (adminCreateUserDTO.getAuthorities() == null || adminCreateUserDTO.getAuthorities().isEmpty()) {
            throw new IllegalArgumentException("È necessario specificare almeno un ruolo per l'utente");
        }

        // Il Mapper fa tutto: inietta i ruoli, nome, cognome, email.
        User user = userMapper.toEntity(adminCreateUserDTO);
        
        user.setPassword(passwordEncoder.encode(adminCreateUserDTO.getPassword()));
        user.setCreatedDate(LocalDateTime.now());
        
        // Se enabled è fornito dall'admin usalo, altrimenti default a true
        if (adminCreateUserDTO.getEnabled() != null) {
            user.setEnabled(adminCreateUserDTO.getEnabled());
        } else {
            user.setEnabled(true);
        }

        user = userRepository.save(user);
        return userMapper.toDto(user);
    }

    public AdminDTO aggiornaUserByAdmin(Integer id, AdminUpdateUserDTO adminUpdateDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));

        if (!isAdmin) {
            throw new AccessDeniedException("Accesso negato: solo un amministratore può aggiornare un utente");
        }

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utente con ID " + id + " non trovato"));

        if (adminUpdateDTO.getEmail() != null) {
            Optional<User> userWithSameEmail = userRepository.findByEmail(adminUpdateDTO.getEmail());
            if (userWithSameEmail.isPresent() && !userWithSameEmail.get().getId().equals(id)) {
                throw new IllegalArgumentException("Email già in uso");
            }
        }

        userMapper.updateEntityFromAdminDto(adminUpdateDTO, existingUser);

        existingUser.setUpdatedDate(LocalDateTime.now());
        User updatedUser = userRepository.save(existingUser);
        
        return new AdminDTO(updatedUser);
    }
}
