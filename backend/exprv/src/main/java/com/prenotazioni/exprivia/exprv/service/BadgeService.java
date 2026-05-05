package com.prenotazioni.exprivia.exprv.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.enumerati.BadgeType;
import com.prenotazioni.exprivia.exprv.repository.BadgeRepository;
import com.prenotazioni.exprivia.exprv.security.AuthoritiesConstants;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepository;

    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }

    public Badge getBadgeByName(String name) {
        return badgeRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Badge non trovato: " + name));
    }

    /**
     * Crea un nuovo badge (Ruolo o Azione).
     */
    public Badge createBadge(String name, BadgeType type, Boolean isActive) {
        String formattedName = name.toUpperCase().trim();
        
        if (type == BadgeType.ROLE && !formattedName.startsWith("ROLE_")) {
            formattedName = "ROLE_" + formattedName;
        }

        Optional<Badge> existing = badgeRepository.findByName(formattedName);
        if (existing.isPresent()) {
            throw new RuntimeException("Il badge " + formattedName + " esiste già.");
        }

        Badge newBadge = new Badge(formattedName, type, isActive != null ? isActive : true);
        return badgeRepository.save(newBadge);
    }

    public Badge updateBadgeStatus(String name, Boolean isActive) {
        Badge badge = getBadgeByName(name);
        badge.setIs_active(isActive);
        return badgeRepository.save(badge);
    }

    @Transactional
    public void deleteBadge(String name) {
        Badge badge = getBadgeByName(name);
        badge.setIs_active(false); // Soft delete
        badgeRepository.save(badge);

        // Pulizia: rimuovere l'ID di questo badge da tutti gli array parent_ids degli altri
        List<Badge> allBadges = badgeRepository.findAll();
        for(Badge b : allBadges) {
            if(b.getParentIds() != null && b.getParentIds().contains(badge.getId())) {
                b.getParentIds().remove(badge.getId());
                badgeRepository.save(b);
            }
        }
    }

    /**
     * Algoritmo DFS per appiattire la gerarchia dei badge.
     */
    public Set<String> flattenBadges(Set<Badge> initialBadges) {
        Set<String> flattened = new HashSet<>();
        if (initialBadges == null || initialBadges.isEmpty()) return flattened;

        // Fetch all active badges once to build a lookup map
        Map<Integer, Badge> badgeMap = badgeRepository.findAll().stream()
            .filter(Badge::getIs_active)
            .collect(Collectors.toMap(Badge::getId, b -> b));
        
        for (Badge badge : initialBadges) {
            resolveHierarchy(badge, flattened, badgeMap);
        }
        return flattened;
    }

    private void resolveHierarchy(Badge badge, Set<String> result, Map<Integer, Badge> badgeMap) {
        if (badge == null || !badge.getIs_active() || result.contains(badge.getName())) {
            return;
        }

        result.add(badge.getName());

        if (badge.getParentIds() != null) {
            for (Integer parentId : badge.getParentIds()) {
                Badge parentBadge = badgeMap.get(parentId);
                if (parentBadge != null) {
                    resolveHierarchy(parentBadge, result, badgeMap);
                }
            }
        }
    }

    /**
     * Verifica se un badge è presente tra quelli posseduti dall'utente corrente.
     */
    public static boolean hasBadge(String badgeName) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals(badgeName));
    }

    /**
     * Recupera la lista piatta dei nomi dei badge dell'utente corrente.
     */
    public static List<String> getCurrentUserBadges() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return List.of();
        }

        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }

    public static boolean isAdmin() {
        return hasBadge(AuthoritiesConstants.ADMIN);
    }

    /**
     * Imposta 'inheritedBadgeName' come padre di 'badgeName'
     * (es. ROLE_MANAGER eredita da ROLE_USER).
     */
    @Transactional
    public void addChild(String badgeName, String inheritedBadgeName) {
        Badge badge = getBadgeByName(badgeName);
        Badge inherited = getBadgeByName(inheritedBadgeName);

        Map<Integer, Badge> badgeMap = badgeRepository.findAll().stream()
            .collect(Collectors.toMap(Badge::getId, b -> b));

        if (hasCycle(badge, inherited, badgeMap)) {
            throw new RuntimeException("Ciclo infinito rilevato! Impossibile collegare i badge.");
        }

        if(badge.getParentIds() == null) {
            badge.setParentIds(new ArrayList<>());
        }
        
        if(!badge.getParentIds().contains(inherited.getId())) {
            badge.getParentIds().add(inherited.getId());
            badgeRepository.save(badge);
        }
    }

    private boolean hasCycle(Badge source, Badge target, Map<Integer, Badge> badgeMap) {
        // Se target eredita da source (direttamente o indirettamente), aggiungerlo crea un ciclo
        if(target.getId().equals(source.getId())) return true;
        
        if(target.getParentIds() != null) {
            for(Integer pId : target.getParentIds()) {
                Badge pBadge = badgeMap.get(pId);
                if(pBadge != null && hasCycle(source, pBadge, badgeMap)) {
                    return true;
                }
            }
        }
        return false;
    }
}