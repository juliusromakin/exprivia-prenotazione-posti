package com.prenotazioni.exprivia.exprv.mapper;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.dto.AdminDTO;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserRegistrationDTO;
import com.prenotazioni.exprivia.exprv.entity.Authority;
import com.prenotazioni.exprivia.exprv.entity.User;

/**
 * Mapper per la conversione tra l'entità User e i vari DTO.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    /**
     * Converte un'entità User in UserDTO.
     */
    @Mapping(target = "authorities", source = "authorities", qualifiedByName = "authoritiesToStrings")
    UserDTO toDto(User user);

    /**
     * Converte un'entità User in AdminDTO.
     */
    default AdminDTO toAdminDto(User user) {
        if (user == null) {
            return null;
        }
        return new AdminDTO(user);
    }

    /**
     * Converte un UserDTO in entità User.
     */
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    User toEntity(UserDTO userDTO);

    /**
     * Converte un UserRegistrationDTO in entità User.
     */
    @Mapping(target = "id_user", ignore = true)
    @Mapping(target = "name", source = "name")
    @Mapping(target = "lastName", source = "lastName")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "password", source = "password")
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    User toEntity(UserRegistrationDTO registrationDTO);

    /**
     * Aggiorna un'entità User esistente con i dati del DTO.
     */
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    void updateUserFromDto(UserDTO userDTO, @MappingTarget User user);

    /**
     * Converte una lista di entità User in una lista di UserDTO.
     */
    List<UserDTO> toDtoList(List<User> users);

    /**
     * Converte una lista di entità Users in una lista di AdminDTO.
     */
    default List<AdminDTO> toAdminDtoList(List<User> users) {
        if (users == null) {
            return null;
        }
        return users.stream()
                .map(this::toAdminDto)
                .collect(Collectors.toList());
    }

    /**
     * Converte un set di Authority in un set di stringhe.
     */
    @Named("authoritiesToStrings")
    default Set<String> authoritiesToStrings(Set<Authority> authorities) {
        if (authorities == null) {
            return new HashSet<>();
        }
        return authorities.stream()
                .map(Authority::getName)
                .filter(name -> name != null)
                .collect(Collectors.toSet());
    }

    /**
     * Converte un set di stringhe in un set di Authority.
     */
    @Named("stringsToAuthorities")
    default Set<Authority> stringsToAuthorities(Set<String> authoritiesAsString) {
        if (authoritiesAsString == null) {
            return new HashSet<>();
        }
        return authoritiesAsString.stream()
                .filter(name -> name != null && !name.isEmpty())
                .map(name -> {
                    Authority auth = new Authority();
                    auth.setName(name);
                    return auth;
                })
                .collect(Collectors.toSet());
    }
}