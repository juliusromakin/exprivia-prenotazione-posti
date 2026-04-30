package com.prenotazioni.exprivia.exprv.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.Workspace;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Integer> {

    List<Workspace> findByRoomId(Integer roomId);
    
    List<Workspace> findByRoomIdAndEnabledTrue(Integer roomId);

    List<Workspace> findByRoomFloorId(Integer floorId);

    List<Workspace> findByRoomFloorIdAndEnabledTrue(Integer floorId);

    List<Workspace> findAllByEnabledTrue();

    Optional<Workspace> findByName(String name);
}
