package com.example.HostHub.strategy;

import com.example.HostHub.entity.Inventory;

import java.math.BigDecimal;

public class HolidayPricingStrategy implements PricingStrategy {

    private final PricingStrategy wrapped;
    private final HolidayCalendar holidayCalendar;

    public HolidayPricingStrategy(PricingStrategy wrapped) {
        this(wrapped, new HolidayCalendar());
    }

    public HolidayPricingStrategy(PricingStrategy wrapped, HolidayCalendar holidayCalendar) {
        this.wrapped = wrapped;
        this.holidayCalendar = holidayCalendar != null ? holidayCalendar : new HolidayCalendar();
    }

    @Override
    public BigDecimal calculatePrice(Inventory inventory) {
        BigDecimal price = wrapped.calculatePrice(inventory);
        if (inventory != null && inventory.getDate() != null && holidayCalendar.isHoliday(inventory.getDate())) {
            price = price.multiply(BigDecimal.valueOf(1.25));
        }
        return price;
    }
}
