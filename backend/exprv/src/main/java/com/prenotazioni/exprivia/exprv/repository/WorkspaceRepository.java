package com.prenotazioni.exprivia.exprv.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.prenotazioni.exprivia.exprv.entity.Workspace;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Integer> {

    @Query("SELECT w FROM Workspace w WHERE w.room.id = :roomId")
    List<Workspace> findByRoomId(@Param("roomId") Integer roomId);
}
