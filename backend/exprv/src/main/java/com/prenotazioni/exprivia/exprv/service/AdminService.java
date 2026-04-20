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
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.mapper.UserMapper;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, UserMapper userMapper,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

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

        if (adminCreateUserDTO.getAuthorities() == null || adminCreateUserDTO.getAuthorities().isEmpty()) {
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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));

        if (!isAdmin) {
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
}
