package com.example.HostHub.service;

import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.HotelMinPrice;
import com.example.HostHub.entity.Inventory;
import com.example.HostHub.repository.HotelMinPriceRepository;
import com.example.HostHub.repository.HotelRepository;
import com.example.HostHub.repository.InventoryRepository;
import com.example.HostHub.strategy.PricingService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class pricingUpdateService {


    //scheduler to update the inventory and hotelMinPrice tables every hour

    private final HotelRepository hotelRepository;
    private final InventoryRepository inventoryRepository;
    private final HotelMinPriceRepository hotelMinPriceRepository;
    private final PricingService pricingService;


    //@Scheduled(cron = "0 0 * * * *")
    @Scheduled(cron = "0 0 * * * *")
    public void updatePrice(){
        int page=0;
        int batchSize=100;

        while (true){
            Page<Hotel>hotelPage = hotelRepository.findAll(PageRequest.of(page,batchSize));
            if (hotelPage.isEmpty()){
                break;
            }
            hotelPage.getContent().forEach(this::updateHotelPrice);

            page++;
        }
    }

    private void updateHotelPrice(Hotel hotel){
        log.info("Updating hotel prices for hotel ID: {}",hotel.getId());

        LocalDate startDate=LocalDate.now();
        LocalDate endDate=LocalDate.now().plusYears(1);

        List<Inventory>inventoryList=inventoryRepository.findByHotelAndDateBetween(hotel,startDate,endDate);
        updateInventoryPrices(inventoryList);

        updateHotelMinPrice(hotel,inventoryList,startDate,endDate);

    }

    private void updateHotelMinPrice(Hotel hotel, List<Inventory> inventoryList, LocalDate startDate, LocalDate endDate) {

        //Compute minimum price per day for the hotel
        Map<LocalDate,BigDecimal> dailyMinPrice = inventoryList.stream()
                .collect(Collectors.groupingBy(
                        Inventory::getDate,
                        Collectors.mapping(Inventory::getPrice,Collectors.minBy(Comparator.naturalOrder()))
                ))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e ->e.getValue().orElse(BigDecimal.ZERO)));

        //Prepare HotelPrice entities in bulk

        List<HotelMinPrice> hotelPrices = new ArrayList<>();
        dailyMinPrice.forEach((date,price)->{
            HotelMinPrice hotelPrice = hotelMinPriceRepository.findByHotelAndDate(hotel,date)
                    .orElse(new HotelMinPrice(hotel,date));

            hotelPrice.setPrice(price);
            hotelPrices.add(hotelPrice);
        });

        //Save all hotelPrice entities in bulk
        hotelMinPriceRepository.saveAll(hotelPrices);
    }

    private void updateInventoryPrices(List<Inventory>inventoryList){

        inventoryList.forEach(inventory -> {
            BigDecimal dynamicPrice= pricingService.calculateDynamicPricing(inventory);
            inventory.setPrice(dynamicPrice);
        });
        inventoryRepository.saveAll(inventoryList);
    }

}
