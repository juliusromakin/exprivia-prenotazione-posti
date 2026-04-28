package com.prenotazioni.exprivia.exprv.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.exceptions.AppException; // Presumo tu abbia questa classe o usa RuntimeException
import com.prenotazioni.exprivia.exprv.repository.AuthorityRepository;
import com.prenotazioni.exprivia.exprv.security.AuthoritiesConstants;

@Service
public class AuthorityService {

    private final AuthorityRepository authorityRepository;

    public AuthorityService(AuthorityRepository authorityRepository) {
        this.authorityRepository = authorityRepository;
    }

    public List<Authority> getAllAuthorities() {
        return authorityRepository.findAll();
    }

    public Authority getAuthorityByName(String name) {
        return authorityRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Ruolo non trovato: " + name));
    }

    public Authority createAuthority(String name, Boolean isActive) {
        String formattedName = name.toUpperCase().trim();
        if (!formattedName.startsWith("ROLE_")) {
            formattedName = "ROLE_" + formattedName;
        }

        Optional<Authority> existing = authorityRepository.findByName(formattedName);
        if (existing.isPresent()) {
            throw new RuntimeException("Il ruolo " + formattedName + " esiste già.");
        }

        Authority newAuthority = new Authority(formattedName, isActive != null ? isActive : true);
        return authorityRepository.save(newAuthority);
    }

    public Authority updateAuthorityStatus(String name, Boolean isActive) {
        Authority authority = getAuthorityByName(name);
        authority.setIs_active(isActive);
        return authorityRepository.save(authority);
    }

    public void deleteAuthority(String name) {
        Authority authority = getAuthorityByName(name);
        authority.setIs_active(false);
        authorityRepository.save(authority);

    }

    public static boolean hasAuthority(String authority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .map(ga -> ga.getAuthority())
                .anyMatch(auth -> auth.equals(authority));
    }

    public static List<String> getCurrentUserRoles() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return List.of();
        }

        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }

    public static boolean isAdmin() {
        return hasAuthority(AuthoritiesConstants.ADMIN);
    }
}