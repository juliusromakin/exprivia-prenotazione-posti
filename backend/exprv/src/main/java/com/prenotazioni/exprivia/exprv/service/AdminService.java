package com.prenotazioni.exprivia.exprv.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.AdminCreateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminUpdateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.UserMapper;
import com.prenotazioni.exprivia.exprv.repository.BadgeRepository;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.Set;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    private void validateUserData(AdminCreateUserDTO adminCreateUserDTO) {
        if (adminCreateUserDTO.getName() == null || adminCreateUserDTO.getName().isEmpty()) {
            throw new AppException("Name cannot be null!", HttpStatus.BAD_REQUEST);
        }
        if (adminCreateUserDTO.getLastName() == null || adminCreateUserDTO.getLastName().isEmpty()) {
            throw new AppException("Last name cannot be null!", HttpStatus.BAD_REQUEST);
        }
        if (adminCreateUserDTO.getEmail() == null || adminCreateUserDTO.getEmail().isEmpty()) {
            throw new AppException("Email cannot be null!", HttpStatus.BAD_REQUEST);
        }
    }

    public UserDTO createUserByAdmin(AdminCreateUserDTO adminCreateUserDTO) {
        validateUserData(adminCreateUserDTO);

        if (userRepository.findByEmail(adminCreateUserDTO.getEmail()).isPresent()) {
            throw new AppException("A user with this email already exists!", HttpStatus.BAD_REQUEST);
        }

        if (adminCreateUserDTO.getBadges() == null || adminCreateUserDTO.getBadges().isEmpty()) {
            throw new AppException("At least one role must be specified for the user", HttpStatus.BAD_REQUEST);
        }

        // Il Mapper fa quasi tutto al posto nostro!
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

    public AdminDTO updateUserByAdmin(Integer id, AdminUpdateUserDTO adminUpdateDTO) {
        if (!BadgeService.isAdmin()) {
            throw new AppException("Access denied: only an administrator can update a user", HttpStatus.FORBIDDEN);
        }

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User with ID " + id + " not found", HttpStatus.NOT_FOUND));

        if (adminUpdateDTO.getEmail() != null) {
            Optional<User> userWithSameEmail = userRepository.findByEmail(adminUpdateDTO.getEmail());
            if (userWithSameEmail.isPresent() && !userWithSameEmail.get().getId().equals(id)) {
                throw new AppException("Email already in use", HttpStatus.BAD_REQUEST);
            }
        }

        userMapper.updateEntityFromAdminDto(adminUpdateDTO, existingUser);

        existingUser.setUpdatedDate(LocalDateTime.now());
        User updatedUser = userRepository.save(existingUser);

        return new AdminDTO(updatedUser);
    }

    @Transactional
    public AdminDTO approveUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("Utente con ID " + id + " non trovato", HttpStatus.NOT_FOUND));

        Badge guestBadge = badgeRepository.findByName("ROLE_GUEST")
                .orElseThrow(() -> new AppException("Badge ROLE_GUEST non trovato", HttpStatus.INTERNAL_SERVER_ERROR));
        
        Badge userBadge = badgeRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new AppException("Badge ROLE_USER non trovato", HttpStatus.INTERNAL_SERVER_ERROR));

        // Rimuoviamo il badge GUEST e aggiungiamo il badge USER
        Set<Badge> badges = user.getBadges();
        badges.removeIf(b -> b.getId().equals(guestBadge.getId()));
        badges.add(userBadge);
        
        user.setBadges(badges);
        user.setUpdatedDate(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        return new AdminDTO(savedUser);
    }
}
