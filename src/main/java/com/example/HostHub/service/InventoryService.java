package com.example.HostHub.service;

import com.example.HostHub.entity.Room;

public interface InventoryService {

    void initializeRoomForAYear(Room room);

    void deleteAllInventories(Room room);
}
