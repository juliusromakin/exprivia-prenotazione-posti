package com.prenotazioni.exprivia.exprv.mapper;

import java.util.ArrayList;
import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.prenotazioni.exprivia.exprv.dto.AdminCreateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminDTO;
import com.prenotazioni.exprivia.exprv.dto.AdminUpdateUserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserDTO;
import com.prenotazioni.exprivia.exprv.dto.UserSignupDTO;
import com.prenotazioni.exprivia.exprv.dto.UserUpdateDTO;
import com.prenotazioni.exprivia.exprv.entity.User;

/**
 * Mapper per la conversione tra l'entità User e i vari DTO.
 */
@Mapper(
    componentModel = "spring", 
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    uses = {BadgeMapper.class}
)
public interface UserMapper {

    /**
     * Converte un'entità User in UserDTO.
     */
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
     * Converte un AdminCreateUserDTO in entità User.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    User toEntity(AdminCreateUserDTO adminCreateUserDTO);

    /**
     * Converte un UserSignupDTO in entità User.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "badges", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    User toEntity(UserSignupDTO userSignupDTO);

    /**
     * Aggiorna profilo utente.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
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

    List<UserDTO> toDtoList(List<User> users);

    default List<AdminDTO> toAdminDtoList(List<User> users) {
        if (users == null) {
            return null;
        }
        List<AdminDTO> list = new ArrayList<>(users.size());
        for (User user : users) {
            list.add(toAdminDto(user));
        }
        return list;
    }

    @Mapping(target = "password", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    void updateEntityFromAdminDto(AdminUpdateUserDTO adminUpdateDTO, @MappingTarget User user);
}