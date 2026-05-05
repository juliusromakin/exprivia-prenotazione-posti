package com.prenotazioni.exprivia.exprv.security;

import com.prenotazioni.exprivia.exprv.entity.User;
import com.prenotazioni.exprivia.exprv.repository.UserRepository;
import com.prenotazioni.exprivia.exprv.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

        private final UserRepository userRepository;
        private final BadgeService badgeService;

        @Override
        public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "Utente non trovato con email: " + email));

                // Usiamo l'algoritmo di flattening per recuperare tutti i badge ereditati
                var allBadges = badgeService.flattenBadges(user.getBadges());

                var authorities = allBadges.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toSet());

                return new org.springframework.security.core.userdetails.User(
                                user.getEmail(),
                                user.getPassword(),
                                user.getEnabled(),
                                true,
                                true,
                                true,
                                authorities);
        }
}