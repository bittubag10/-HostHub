package com.example.HostHub.strategy;

import com.example.HostHub.entity.Inventory;

import java.math.BigDecimal;

public interface PricingStrategy {


    BigDecimal calculatePrice(Inventory inventory);
}
