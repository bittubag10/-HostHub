package com.example.HostHub.service;

import com.example.HostHub.dto.ProfileUpdateRequestDto;
import com.example.HostHub.entity.User;

public interface UserService {

    User getUserById(Long id);

    void updateProfile(ProfileUpdateRequestDto profileUpdateRequestDto);
}
