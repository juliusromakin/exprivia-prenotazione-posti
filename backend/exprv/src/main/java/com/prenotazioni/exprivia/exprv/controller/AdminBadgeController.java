package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import com.prenotazioni.exprivia.exprv.dto.BadgeDTO;
import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.mapper.BadgeMapper;
import com.prenotazioni.exprivia.exprv.service.BadgeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/badges")
@RequiredArgsConstructor
public class AdminBadgeController {

    private final BadgeMapper badgeMapper;
    private final BadgeService badgeService;

    @PreAuthorize("hasAuthority('ACTION_BADGE_READ')")
    @GetMapping
    public ResponseEntity<List<BadgeDTO>> getAllBadges() {
        return ResponseEntity.ok(badgeMapper.toDtoList(badgeService.getAllBadges()));
    }

    @PreAuthorize("hasAuthority('ACTION_BADGE_READ')")
    @GetMapping("/{name}")
    public ResponseEntity<BadgeDTO> getBadge(@PathVariable String name) {
        Badge badge = badgeService.getBadgeByName(name);
        return ResponseEntity.ok(badgeMapper.toDto(badge));
    }

    @PreAuthorize("hasAuthority('ACTION_BADGE_CREATE')")
    @PostMapping
    public ResponseEntity<BadgeDTO> createBadge(@Valid @RequestBody BadgeDTO badgeDto) {
        Badge created = badgeService.createBadge(badgeDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(badgeMapper.toDto(created));
    }

    @PreAuthorize("hasAuthority('ACTION_BADGE_UPDATE')")
    @PutMapping("/{id}")
    public ResponseEntity<BadgeDTO> updateBadge(
            @PathVariable Integer id,
            @RequestBody BadgeDTO badgeDto) {
        Badge updated = badgeService.updateBadge(id, badgeDto);
        return ResponseEntity.ok(badgeMapper.toDto(updated));
    }

    @PreAuthorize("hasAuthority('ACTION_BADGE_DELETE')")
    @DeleteMapping("/{name}")
    public ResponseEntity<Void> deleteBadge(
            @PathVariable String name,
            @RequestParam(defaultValue = "false") boolean preserveHierarchy) {
        badgeService.deleteBadge(name, preserveHierarchy);
        return ResponseEntity.noContent().build();
    }

    /**
     * Endpoint speciale HRBAC: Aggiunge un badge figlio a un badge genitore.
     * Es: /api/admin/badges/ROLE_ADMIN/children/ROLE_USER
     */
    @PreAuthorize("hasAuthority('ACTION_BADGE_UPDATE')")
    @PostMapping("/{parentName}/children/{childName}")
    public ResponseEntity<Void> addChildBadge(@PathVariable String parentName, @PathVariable String childName) {
        badgeService.addChild(parentName, childName);
        return ResponseEntity.ok().build();
    }
}
