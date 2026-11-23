package com.example.HostHub.dto;

import com.example.HostHub.Enum.Gender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GuestDto {
    private Long id;

    @NotBlank(message = "Guest name cannot be empty or null")
    @Size(min = 2, max = 50, message = "Guest name must be between 2 and 50 characters")
    private String name;

    @NotNull(message = "Gender is required (MALE, FEMALE, etc.)")
    private Gender gender;

    @NotNull(message = "Age is required")
    @Min(value = 1, message = "Age must be at least 1 year")
    @Max(value = 80, message = "Age cannot be greater than 80 years")
    private Integer age;
}
