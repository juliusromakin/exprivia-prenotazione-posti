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
import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
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
     * Retrieves all users from the database as AdminDTO (for ADMIN role users)
     *
     * @return List of AdminDTO
     */
    public List<AdminDTO> findAllUsers() {
        List<User> usersList = userRepository.findAll();
        return userMapper.toAdminDtoList(usersList);
    }

    /**
     * Retrieves a user by ID as AdminDTO (for ADMIN role users)
     *
     * @return AdminDTO
     */
    public AdminDTO findUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User with ID " + id + " not found", HttpStatus.NOT_FOUND));
        return new AdminDTO(user);
    }

    /**
     * Retrieves a user by email as AdminDTO (for ADMIN role users)
     *
     * @return AdminDTO
     */
    public AdminDTO findUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new AppException("User with email " + email + " not found", HttpStatus.NOT_FOUND));
        return new AdminDTO(user);
    }

    public Authority getAuthorityByName(String name) {
        return authorityRepository.findByName(name)
                .orElseThrow(() -> new AppException("Authority not found with name: " + name, HttpStatus.NOT_FOUND));
    }

    /**
     * Updates a user with provided data
     *
     * @param id        ID of the user to update
     * @param updateDTO DTO with update data
     * @return UserDTO of the updated user
     * @throws AppException if data is invalid or user doesn't exist
     */
    public UserDTO updateUser(Integer id, UserUpdateDTO updateDTO) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User with ID " + id + " not found", HttpStatus.NOT_FOUND));

        // Check for duplicate email
        if (updateDTO.getEmail() != null) {
            Optional<User> userWithSameEmail = userRepository.findByEmail(updateDTO.getEmail());
            if (userWithSameEmail.isPresent() && !userWithSameEmail.get().getId_user().equals(id)) {
                throw new AppException("Email already in use", HttpStatus.BAD_REQUEST);
            }
        }

        // Verify password if attempting to change
        if (updateDTO.getNewPassword() != null && !updateDTO.getNewPassword().trim().isEmpty()) {
            String currentPassword = updateDTO.getCurrentPassword();

            if (currentPassword == null || currentPassword.trim().isEmpty()) {
                throw new AppException("Current password is required to change password", HttpStatus.BAD_REQUEST);
            }

            // Verify current password matches DB
            if (!passwordEncoder.matches(currentPassword, existingUser.getPassword())) {
                throw new AppException("Incorrect current password", HttpStatus.BAD_REQUEST);
            }

            // Set new encrypted password
            existingUser.setPassword(passwordEncoder.encode(updateDTO.getNewPassword()));
        }

        // Use mapper for other generic fields
        userMapper.updateEntityFromUserUpdateDto(updateDTO, existingUser);

        existingUser.setUpdatedDate(LocalDateTime.now());
        User updatedUser = userRepository.save(existingUser);
        return userMapper.toDto(updatedUser);
    }

    /**
     * Deletes a user from the system
     *
     * @param id ID of the user to delete
     * @throws AppException if user doesn't exist
     */
    public void deleteUser(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new AppException("User with ID " + id + " not found", HttpStatus.NOT_FOUND);
        }
        userRepository.deleteById(id);
    }

    /**
     * Deletes the authenticated user's personal account
     *
     * @param email Email of the user to delete
     * @throws AppException if user doesn't exist
     */
    public void deletePersonalAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        // Verify user is deleting their own account
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!email.equals(authentication.getName())) {
            throw new AppException("You do not have permission to delete this account", HttpStatus.FORBIDDEN);
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
                .orElseThrow(() -> new AppException("User with email " + email + " not found", HttpStatus.NOT_FOUND));

        return userMapper.toDto(user);
    }

    public UserDTO findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User with email " + email + " not found", HttpStatus.NOT_FOUND));
        return userMapper.toDto(user);
    }

}
