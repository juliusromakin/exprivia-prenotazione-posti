package com.prenotazioni.exprivia.exprv.security;

import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

        private final UserRepository userRepository;

        // Costruttore per la Dependency Injection
        public CustomUserDetailsService(UserRepository userRepository) {
                this.userRepository = userRepository;
        }

        @Override
        public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "Utente non trovato con email: " + email));

                var authorities = user.getAuthorities().stream()
                                .map(authority -> new SimpleGrantedAuthority(authority.getName()))
                                .collect(Collectors.toSet());

                return new org.springframework.security.core.userdetails.User(
                                user.getEmail(),
                                user.getPassword(),
                                user.getEnabled(), // enabled
                                true, // accountNonExpired
                                true, // credentialsNonExpired
                                true, // accountNonLocked
                                authorities);
        }
}