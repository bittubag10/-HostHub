package com.example.HostHub.repository;

import com.example.HostHub.entity.Inventory;
import com.example.HostHub.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory,Long> {

    void deleteByRoom( Room room);
}
