//package com.example.HostHub.repository;
//
//import com.example.HostHub.dto.HotelPriceDto;
//import com.example.HostHub.entity.Hotel;
//import com.example.HostHub.entity.HotelMinPrice;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//import org.springframework.stereotype.Repository;
//
//
//import java.time.LocalDate;
//import java.util.Optional;
//
//@Repository
//public interface HotelMinPriceRepository extends JpaRepository<HotelMinPrice,Long> {
//    @Query("""
//               SELECT com.example.HostHub.dto.HotelPriceDto(i.hotel, AVG(i.price))
//               FROM HotelMinPrice i
//               WHERE i.hotel.city = :city
//                    AND i.date BETWEEN :startDate AND :endDate
//                    AND i.hotel.active = true
//               GROUP BY i.hotel
//               """)
//    Page<HotelPriceDto> findHotelsWithAvailableInventory(
//            @Param("city") String city,
//            @Param("startDate") LocalDate startDate,
//            @Param("endDate") LocalDate endDate,
//            @Param("roomsCount") Integer roomsCount,
//            @Param("dateCount") Long dateCount,
//            Pageable pageable
//    );
//
//    Optional<HotelMinPrice> findByHotelAndDate(Hotel hotel, LocalDate date);
//}
package com.example.HostHub.repository;

import com.example.HostHub.dto.HotelPriceDto;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.HotelMinPrice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface HotelMinPriceRepository extends JpaRepository<HotelMinPrice, Long> {

    @Query("""
               SELECT new com.example.HostHub.dto.HotelPriceDto(i.hotel, AVG(i.price))
               FROM HotelMinPrice i
               WHERE i.hotel.city = :city
                    AND i.date BETWEEN :startDate AND :endDate
                    AND i.hotel.active = true
               GROUP BY i.hotel
               """)
    Page<HotelPriceDto> findHotelsWithAvailableInventory(
            @Param("city") String city,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    ); // 🔥 FIXED: 'new' keyword lagaya aur extra params hata diye kyunki query unhe use nahi kar rahi thi!

    Optional<HotelMinPrice> findByHotelAndDate(Hotel hotel, LocalDate date);
}