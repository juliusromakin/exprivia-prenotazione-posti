package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.prenotazioni.exprivia.exprv.dto.AuthorityDTO;
import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.service.AuthorityService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/authorities")
public class AdminAuthorityController {

    private final AuthorityService authorityService;

    public AdminAuthorityController(AuthorityService authorityService) {
        this.authorityService = authorityService;
    }

    private AuthorityDTO convertToDto(Authority authority) {
        return new AuthorityDTO(authority.getName(), authority.getIs_active());
    }

    @GetMapping
    public ResponseEntity<List<AuthorityDTO>> getAllAuthorities() {
        List<AuthorityDTO> authorities = authorityService.getAllAuthorities().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(authorities);
    }

    @GetMapping("/{name}")
    public ResponseEntity<AuthorityDTO> getAuthority(@PathVariable String name) {
        Authority authority = authorityService.getAuthorityByName(name);
        return ResponseEntity.ok(convertToDto(authority));
    }

    @PostMapping
    public ResponseEntity<AuthorityDTO> createAuthority(@Valid @RequestBody AuthorityDTO authorityDto) {
        Authority created = authorityService.createAuthority(authorityDto.getName(), authorityDto.getIs_active());
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDto(created));
    }

    @PutMapping("/{name}")
    public ResponseEntity<AuthorityDTO> updateAuthority(
            @PathVariable String name,
            @RequestBody AuthorityDTO authorityDto) {
        Authority updated = authorityService.updateAuthorityStatus(name, authorityDto.getIs_active());
        return ResponseEntity.ok(convertToDto(updated));
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<Void> deleteAuthority(@PathVariable String name) {
        authorityService.deleteAuthority(name);
        return ResponseEntity.noContent().build();
    }
}