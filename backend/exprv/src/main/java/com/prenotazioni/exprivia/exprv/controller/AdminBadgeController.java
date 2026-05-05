package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.prenotazioni.exprivia.exprv.dto.BadgeDTO;
import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.service.BadgeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/badges")
@RequiredArgsConstructor
public class AdminBadgeController {

    private final BadgeService badgeService;

    private BadgeDTO convertToDto(Badge badge) {
        return new BadgeDTO(badge.getId(), badge.getName(), badge.getType(), badge.getDescription(), badge.getParentIds(), badge.getIs_active());
    }

    @GetMapping
    public ResponseEntity<List<BadgeDTO>> getAllBadges() {
        List<BadgeDTO> badges = badgeService.getAllBadges().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(badges);
    }

    @GetMapping("/{name}")
    public ResponseEntity<BadgeDTO> getBadge(@PathVariable String name) {
        Badge badge = badgeService.getBadgeByName(name);
        return ResponseEntity.ok(convertToDto(badge));
    }

    @PostMapping
    public ResponseEntity<BadgeDTO> createBadge(@Valid @RequestBody BadgeDTO badgeDto) {
        Badge created = badgeService.createBadge(badgeDto.getName(), badgeDto.getType(), badgeDto.getIs_active());
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDto(created));
    }

    @PutMapping("/{name}")
    public ResponseEntity<BadgeDTO> updateBadge(
            @PathVariable String name,
            @RequestBody BadgeDTO badgeDto) {
        Badge updated = badgeService.updateBadgeStatus(name, badgeDto.getIs_active());
        return ResponseEntity.ok(convertToDto(updated));
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<Void> deleteBadge(@PathVariable String name) {
        badgeService.deleteBadge(name);
        return ResponseEntity.noContent().build();
    }

    /**
     * Endpoint speciale HRBAC: Aggiunge un badge figlio a un badge genitore.
     * Es: /api/admin/badges/ROLE_ADMIN/children/ROLE_USER
     */
    @PostMapping("/{parentName}/children/{childName}")
    public ResponseEntity<Void> addChildBadge(@PathVariable String parentName, @PathVariable String childName) {
        badgeService.addChild(parentName, childName);
        return ResponseEntity.ok().build();
    }
}
