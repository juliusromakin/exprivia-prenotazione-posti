package com.prenotazioni.exprivia.exprv.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.prenotazioni.exprivia.exprv.dto.UserSignupDTO;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import com.prenotazioni.exprivia.exprv.repository.AuthorityRepository;
import com.prenotazioni.exprivia.exprv.mapper.UserMapper;
import com.prenotazioni.exprivia.exprv.security.jwt.JwtTokenProvider;
import com.prenotazioni.exprivia.exprv.service.EmailService;
import com.prenotazioni.exprivia.exprv.service.PasswordResetService;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AuthorityRepository authorityRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserMapper userMapper;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private PasswordResetService passwordResetService;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User user;
    private UserSignupDTO registrationDTO;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("test@example.com");
        user.setId(1);
        user.setEnabled(false);

        registrationDTO = new UserSignupDTO();
        registrationDTO.setEmail("test@example.com");
        registrationDTO.setPassword("password123");
        registrationDTO.setName("Mario");
        registrationDTO.setLastName("Rossi");
    }

    @Test
    void testCreaUtente_Success() {
        // Arrange
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userMapper.toEntity(any(UserSignupDTO.class))).thenReturn(user);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        
        Authority authority = new Authority();
        authority.setName("ROLE_USER");
        when(authorityRepository.findByName("ROLE_USER")).thenReturn(Optional.of(authority));
        
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toDto(any(User.class))).thenReturn(new UserDTO());

        // Act
        UserDTO result = authService.creaUtente(registrationDTO);

        // Assert
        assertNotNull(result);
        assertFalse(user.getEnabled(), "L'utente dovrebbe essere inattivo alla creazione");
        verify(userRepository, times(1)).save(any(User.class));
    }
}
