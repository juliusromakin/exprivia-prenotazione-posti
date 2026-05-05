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

import com.prenotazioni.exprivia.exprv.dto.AdminCreateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminUpdateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserSignupDTO;
import com.prenotazioni.exprivia.exprv.dto.UserUpdateDTO;
import com.prenotazioni.exprivia.exprv.entity.Badge;
import com.prenotazioni.exprivia.exprv.entity.User;

import org.mapstruct.NullValuePropertyMappingStrategy;

/**
 * Mapper per la conversione tra l'entità User e i vari DTO.
 */
@Mapper(
    componentModel = "spring", 
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface UserMapper {

    /**
     * Converte un'entità User in UserDTO.
     */
    @Mapping(target = "badges", source = "badges", qualifiedByName = "badgesToStrings")
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
    @Mapping(target = "badges", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    User toEntity(UserDTO userDTO);

    /**
     * Converte un AdminCreateUserDTO in entità User (per creazioni tramite Admin).
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true) // Ignorata qui perché verrà criptata a mano nel service
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    @Mapping(target = "badges", source = "badges", qualifiedByName = "stringsToBadges")
    User toEntity(AdminCreateUserDTO adminCreateUserDTO);

    /**
     * Converte un UserSignupDTO in entità User (per registrazioni pubbliche
     * standard).
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true) // Ignorata qui perché verrà criptata a mano nel service
    @Mapping(target = "badges", ignore = true) // Niente ruoli per sicurezza!
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    @Mapping(target = "enabled", ignore = true) // Gestito di default nel DB
    User toEntity(UserSignupDTO userSignupDTO);

    /**
     * Aggiorna profilo utente da parte dell'utente stesso
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true) // Gestita separatamente
    @Mapping(target = "badges", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    void updateEntityFromUserUpdateDto(UserUpdateDTO updateDTO, @MappingTarget User user);

    @Mapping(target = "password", ignore = true)
    @Mapping(target = "badges", ignore = true)
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
     * Converte un set di Badge in un set di stringhe.
     */
    @Named("badgesToStrings")
    default Set<String> badgesToStrings(Set<Badge> badges) {
        if (badges == null) {
            return new HashSet<>();
        }
        return badges.stream()
                .map(Badge::getName)
                .filter(name -> name != null)
                .collect(Collectors.toSet());
    }

    /**
     * Converte un set di stringhe in un set di Badge.
     */
    @Named("stringsToBadges")
    default Set<Badge> stringsToBadges(Set<String> badgesAsString) {
        if (badgesAsString == null) {
            return new HashSet<>();
        }
        return badgesAsString.stream()
                .filter(name -> name != null && !name.isEmpty())
                .map(name -> {
                    Badge auth = new Badge();
                    auth.setName(name);
                    return auth;
                })
                .collect(Collectors.toSet());
    }

    @Mapping(target = "password", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    @Mapping(target = "badges", source = "badges", qualifiedByName = "stringsToBadges")
    void updateEntityFromAdminDto(AdminUpdateUserDTO adminUpdateDTO, @MappingTarget User user);
}