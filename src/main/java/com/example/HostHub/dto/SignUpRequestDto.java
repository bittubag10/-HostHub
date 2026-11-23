package com.example.HostHub.dto;

import com.example.HostHub.Enum.Gender;
import com.example.HostHub.annotation.EmailValidation;
import com.example.HostHub.annotation.PasswordValidation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SignUpRequestDto {

    @NotBlank(message = "Email cannot be empty")
    @EmailValidation
    private String email ;

    @NotBlank(message = "Password cannot be empty")
    @PasswordValidation
    private String password;

    @NotBlank(message = "Name cannot be empty")
    private String name;

    @NotNull(message = "Gender is required")
    private Gender gender;


    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be a past date")
    private LocalDate dateOfBirth;

}
