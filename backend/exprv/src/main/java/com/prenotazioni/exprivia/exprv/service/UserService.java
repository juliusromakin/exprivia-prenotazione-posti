package com.prenotazioni.exprivia.exprv.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.dto.AdminDTO;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserUpdateDTO;
import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.UserMapper;
import com.prenotazioni.exprivia.exprv.repository.BadgeRepository;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import com.prenotazioni.exprivia.exprv.security.jwt.JwtTokenProvider;

import jakarta.transaction.Transactional;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final BadgeService badgeService;

    private void verifyOwnershipOrAny(String targetEmail, String anyAuthority) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Utente non autenticato");
        }

        boolean hasAny = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(anyAuthority));

        if (!hasAny && targetEmail != null && !targetEmail.equals(auth.getName())) {
            throw new AccessDeniedException("Non hai i permessi per agire su questo profilo");
        }
    }

    /**
     * Retrieves all users from the database as AdminDTO (for ADMIN role users)
     */
    public List<AdminDTO> findAllUsers() {
        List<User> usersList = userRepository.findAll();
        return userMapper.toAdminDtoList(usersList);
    }

    /**
     * Retrieves a user by ID as AdminDTO (for ADMIN role users)
     */
    public AdminDTO findUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("USER_NOT_FOUND",
                        "User with ID " + id + " not found",
                        Map.of("id", id),
                        HttpStatus.NOT_FOUND));
        return userMapper.toAdminDto(user);
    }

    /**
     * Retrieves a user by email as AdminDTO (for ADMIN role users)
     */
    public AdminDTO findUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new AppException(
                                "USER_BY_EMAIL_NOT_FOUND",
                                "User with email " + email + " not found",
                                Map.of("email", email),
                                HttpStatus.NOT_FOUND));
        return userMapper.toAdminDto(user);
    }

    public Badge getBadgeByName(String name) {
        return badgeRepository.findByName(name)
                .orElseThrow(() -> new AppException(
                        "BADGE_NOT_FOUND",
                        "Badge not found with name: " + name,
                        Map.of("name", name),
                        HttpStatus.NOT_FOUND));
    }

    /**
     * Updates a user with provided data
     */
    public UserDTO updateUser(Integer id, UserUpdateDTO updateDTO) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new AppException(
                        "USER_NOT_FOUND",
                        "User with ID " + id + " not found",
                        Map.of("id", id),
                        HttpStatus.NOT_FOUND));

        verifyOwnershipOrAny(existingUser.getEmail(), "ACTION_USER_UPDATE_ANY");

        if (updateDTO.getEmail() != null) {
            Optional<User> userWithSameEmail = userRepository.findByEmail(updateDTO.getEmail());
            if (userWithSameEmail.isPresent() && !userWithSameEmail.get().getId().equals(id)) {
                throw new AppException(
                        "EMAIL_ALREADY_IN_USE",
                        "Email already in use",
                        Map.of("email", updateDTO.getEmail()),
                        HttpStatus.BAD_REQUEST);
            }
        }

        if (updateDTO.getNewPassword() != null && !updateDTO.getNewPassword().trim().isEmpty()) {
            String currentPassword = updateDTO.getCurrentPassword();

            if (currentPassword == null || currentPassword.trim().isEmpty()) {
                throw new AppException(
                        "CURRENT_PASSWORD_REQUIRED",
                        "Current password is required to change password",
                        HttpStatus.BAD_REQUEST);
            }

            if (!passwordEncoder.matches(currentPassword, existingUser.getPassword())) {
                throw new AppException(
                        "INCORRECT_CURRENT_PASSWORD",
                        "Incorrect current password",
                        HttpStatus.BAD_REQUEST);
            }

            existingUser.setPassword(passwordEncoder.encode(updateDTO.getNewPassword()));
        }

        userMapper.updateEntityFromUserUpdateDto(updateDTO, existingUser);

        existingUser.setUpdatedDate(LocalDateTime.now());
        User updatedUser = userRepository.save(existingUser);
        return userMapper.toDto(updatedUser);
    }

    /**
     * Deletes a user from the system
     */
    public void deleteUser(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new AppException(
                    "USER_NOT_FOUND",
                    "User with ID " + id + " not found",
                    Map.of("id", id),
                    HttpStatus.NOT_FOUND);
        }
        userRepository.deleteById(id);
    }

    /**
     * Deletes the authenticated user's personal account
     */
    public void deletePersonalAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(
                        "USER_NOT_FOUND",
                        "User not found",
                        Map.of("email", email),
                        HttpStatus.NOT_FOUND));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!email.equals(authentication.getName())) {
            throw new AppException(
                    "FORBIDDEN_DELETE_ACCOUNT",
                    "You do not have permission to delete this account",
                    HttpStatus.FORBIDDEN);
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
                .orElseThrow(() -> new AppException(
                        "USER_NOT_FOUND",
                        "User with email " + email + " not found",
                        Map.of("email", email),
                        HttpStatus.NOT_FOUND));

        UserDTO dto = userMapper.toDto(user);
        // Appiattisce i badge per il frontend
        dto.setBadges(badgeService.flattenBadges(user.getBadges()));
        return dto;
    }

    public UserDTO findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(
                        "USER_NOT_FOUND",
                        "User with email " + email + " not found",
                        Map.of("email", email),
                        HttpStatus.NOT_FOUND));

        UserDTO dto = userMapper.toDto(user);
        // Appiattisce i badge per il frontend
        dto.setBadges(badgeService.flattenBadges(user.getBadges()));
        return dto;
    }
}
