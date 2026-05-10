package com.prenotazioni.exprivia.exprv.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.prenotazioni.exprivia.exprv.dto.BadgeDTO;
import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.enumerati.BadgeType;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.repository.BadgeRepository;
import com.prenotazioni.exprivia.exprv.security.AuthoritiesConstants;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service per la gestione dei Badge (Ruoli e Azioni) e della gerarchia HRBAC.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepository;

    /**
     * Recupera tutti i badge presenti nel sistema.
     */
    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }

    /**
     * Recupera un badge tramite il suo nome univoco.
     */
    public Badge getBadgeByName(String name) {
        return badgeRepository.findByName(name)
                .orElseThrow(() -> new AppException("Badge non trovato: " + name, HttpStatus.NOT_FOUND));
    }

    /**
     * Crea un nuovo badge (Ruolo o Azione).
     * Se il tipo è ROLE, assicura che il nome inizi con 'ROLE_'.
     */
    @Transactional
    public Badge createBadge(BadgeDTO badgeDto) {
        String formattedName = formatBadgeName(badgeDto.getName(), badgeDto.getType());

        if (badgeRepository.findByName(formattedName).isPresent()) {
            throw new AppException("Il badge " + formattedName + " esiste già.", HttpStatus.CONFLICT);
        }

        Badge newBadge = new Badge();
        newBadge.setName(formattedName);
        newBadge.setType(badgeDto.getType());
        newBadge.setDescription(badgeDto.getDescription());
        newBadge.setParentIds(badgeDto.getParentIds() != null ? badgeDto.getParentIds() : new ArrayList<>());
        newBadge.setIsActive(badgeDto.getIsActive() != null ? badgeDto.getIsActive() : true);

        log.info("Creato nuovo badge: {} di tipo {}", formattedName, badgeDto.getType());
        return badgeRepository.save(newBadge);
    }

    /**
     * Aggiorna un badge esistente.
     */
    @Transactional
    public Badge updateBadge(Integer id, BadgeDTO badgeDto) {
        Badge badge = badgeRepository.findById(id)
                .orElseThrow(() -> new AppException("Badge non trovato con ID: " + id, HttpStatus.NOT_FOUND));

        String formattedName = formatBadgeName(badgeDto.getName(), badgeDto.getType());

        if (!badge.getName().equals(formattedName)) {
            if (badgeRepository.findByName(formattedName).isPresent()) {
                throw new AppException("Il badge " + formattedName + " esiste già.", HttpStatus.CONFLICT);
            }
            badge.setName(formattedName);
        }

        if (badgeDto.getParentIds() != null && !badgeDto.getParentIds().isEmpty()) {
            List<Badge> allBadges = badgeRepository.findAll();

            Map<Integer, Badge> badgeMap = new HashMap<>();
            for (Badge b : allBadges) {
                badgeMap.put(b.getId(), b);
            }

            for (Integer pId : badgeDto.getParentIds()) {
                if (isReachable(pId, id, badgeMap)) {
                    Badge parent = badgeMap.get(pId);
                    String parentName = (parent != null) ? parent.getName() : pId.toString();
                    throw new AppException("Ciclo rilevato! Il badge " + parentName + " eredita gia da questo badge.",
                            HttpStatus.BAD_REQUEST);
                }
            }
        }

        badge.setType(badgeDto.getType());
        badge.setDescription(badgeDto.getDescription());
        badge.setParentIds(badgeDto.getParentIds() != null ? badgeDto.getParentIds() : new ArrayList<>());
        badge.setIsActive(badgeDto.getIsActive() != null ? badgeDto.getIsActive() : true);

        log.info("Aggiornato badge ID {}: {}", id, formattedName);
        return badgeRepository.save(badge);
    }

    /**
     * Aggiorna solo lo stato di attivazione di un badge tramite nome.
     */
    @Transactional
    public Badge updateBadgeStatus(String name, Boolean isActive) {
        Badge badge = getBadgeByName(name);
        badge.setIsActive(isActive);
        return badgeRepository.save(badge);
    }

    /**
     * Disattiva un badge (soft delete) e lo rimuove dalle gerarchie degli altri
     * badge.
     */
    @Transactional
    public void deleteBadge(String name, boolean preserveHierarchy) {
        Badge badge = getBadgeByName(name);

        List<Integer> grandParents = new ArrayList<>();
        if (badge.getParentIds() != null) {
            for (Integer gpId : badge.getParentIds()) {
                grandParents.add(gpId);
            }
        }

        badge.setIsActive(false);
        badge.setParentIds(new ArrayList<>());
        badgeRepository.save(badge);

        List<Badge> allBadges = badgeRepository.findAll();
        for (Badge b : allBadges) {
            if (b.getParentIds() != null && b.getParentIds().contains(badge.getId())) {
                badgeRepository.save(b);

                if (preserveHierarchy && !grandParents.isEmpty()) {
                    b.getParentIds().remove(badge.getId());

                    if (preserveHierarchy && !grandParents.isEmpty()) {
                        for (Integer gpId : grandParents) {
                            if (!gpId.equals(b.getId()) && !b.getParentIds().contains(gpId)) {
                                b.getParentIds().add(gpId);
                            }
                        }
                    }
                    badgeRepository.save(b);
                }
            }
        }
    }

    /**
     * Algoritmo DFS per appiattire la gerarchia dei badge in una lista di stringhe (nomi).
     */
    public Set<String> flattenBadges(Set<Badge> initialBadges) {
        Set<String> flattenedNames = new HashSet<>();
        if (initialBadges == null || initialBadges.isEmpty()) {
            return flattenedNames;
        }

        List<Badge> allBadges = badgeRepository.findAll();
        Map<Integer, Badge> activeBadgeMap = new HashMap<>();
        for (Badge b : allBadges) {
            if (b.getIsActive()) {
                activeBadgeMap.put(b.getId(), b);
            }
        }

        for (Badge badge : initialBadges) {
            resolveHierarchy(badge, flattenedNames, activeBadgeMap);
        }
        return flattenedNames;
    }

    private void resolveHierarchy(Badge badge, Set<String> result, Map<Integer, Badge> badgeMap) {
        if (badge == null || !badge.getIsActive() || result.contains(badge.getName())) {
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
     * Helper per formattare il nome del badge in maiuscolo e aggiungere il prefisso
     * ROLE_ se necessario.
     */
    private String formatBadgeName(String name, BadgeType type) {
        String formatted = name.toUpperCase().trim();
        if (type == BadgeType.ROLE && !formatted.startsWith("ROLE_")) {
            formatted = "ROLE_" + formatted;
        }
        return formatted;
    }

    // --- Metodi Utility Statici per Security ---

    public static boolean hasBadge(String badgeName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        for (GrantedAuthority authority : auth.getAuthorities()) {
            if (authority.getAuthority().equals(badgeName)) {
                return true;
            }
        }
        return false;
    }

    public static List<String> getCurrentUserBadges() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return new ArrayList<>();
        }
        List<String> badgeNames = new ArrayList<>();
        for (GrantedAuthority authority : auth.getAuthorities()) {
            badgeNames.add(authority.getAuthority());
        }
        return badgeNames;
    }

    public static boolean isAdmin() {
        return hasBadge(AuthoritiesConstants.ADMIN);
    }

    @Transactional
    public void addChild(String badgeName, String inheritedBadgeName) {
        Badge badge = getBadgeByName(badgeName);
        Badge inherited = getBadgeByName(inheritedBadgeName);

        List<Badge> allBadges = badgeRepository.findAll();
        Map<Integer, Badge> badgeMap = new HashMap<>();
        for (Badge b : allBadges) {
            badgeMap.put(b.getId(), b);
        }

        if (isReachable(inherited.getId(), badge.getId(), badgeMap)) {
            throw new AppException("Ciclo infinito rilevato! Impossibile collegare i badge.", HttpStatus.BAD_REQUEST);
        }

        if (badge.getParentIds() == null) {
            badge.setParentIds(new ArrayList<>());
        }

        if (!badge.getParentIds().contains(inherited.getId())) {
            badge.getParentIds().add(inherited.getId());
            badgeRepository.save(badge);
            log.info("Badge {} ora eredita da {}", badgeName, inheritedBadgeName);
        }
    }

    private boolean isReachable(Integer startId, Integer targetId, Map<Integer, Badge> badgeMap) {
        if (startId.equals(targetId)) {
            return true;
        }

        Badge badge = badgeMap.get(startId);
        if (badge != null && badge.getParentIds() != null) {
            for (Integer pId : badge.getParentIds()) {
                if (isReachable(pId, targetId, badgeMap)) {
                    return true;
                }
            }
        }
        return false;
    }

}
