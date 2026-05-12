package com.prenotazioni.exprivia.exprv.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.prenotazioni.exprivia.exprv.dto.AdminCreateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminUpdateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.exceptions.AppException;
import com.prenotazioni.exprivia.exprv.service.AdminService;
import com.prenotazioni.exprivia.exprv.service.UserService;

@RestController
@RequestMapping("/api/admin/users")
public class AdminController {

    private final UserService userService;
    private final AdminService adminService;

    public AdminController(UserService userService, AdminService adminService) {
        this.userService = userService;
        this.adminService = adminService;
    }

    @PreAuthorize("hasAuthority('ACTION_USER_READ')")
    @GetMapping
    public ResponseEntity<List<AdminDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllUsers());
    }

    @PreAuthorize("hasAuthority('ACTION_USER_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<AdminDTO> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.findUserById(id));
    }

    @PreAuthorize("hasAuthority('ACTION_USER_READ')")
    @GetMapping("/email/{email}")
    public ResponseEntity<AdminDTO> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.findUserByEmail(email));
    }

    @PreAuthorize("hasAuthority('ACTION_USER_CREATE')")
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody AdminCreateUserDTO registrationDTO) {
        UserDTO newUser = adminService.createUserByAdmin(registrationDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
    }

    @PreAuthorize("hasAuthority('ACTION_USER_UPDATE_ANY')")
    @PutMapping("/{id}")
    public ResponseEntity<AdminDTO> updateUser(@PathVariable Integer id, @RequestBody AdminUpdateUserDTO updateDTO) {
        AdminDTO updatedUser = adminService.updateUserByAdmin(id, updateDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @PreAuthorize("hasAuthority('ACTION_USER_DELETE_ANY')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

}
