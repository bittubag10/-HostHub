package com.example.HostHub.repository;

import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HotelRepository extends JpaRepository<Hotel,Long> {
    List<Hotel> findByOwner(User user);

    @Query("SELECT DISTINCT h.city FROM Hotel h WHERE h.active = true AND h.city IS NOT NULL ORDER BY h.city ASC")
    List<String> findDistinctActiveCities();
}
