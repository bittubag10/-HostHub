package com.example.HostHub.Security;

import com.example.HostHub.Enum.Roles;
import com.example.HostHub.dto.LoginDto;
import com.example.HostHub.dto.SignUpRequestDto;
import com.example.HostHub.dto.UserDto;
import com.example.HostHub.entity.User;
import com.example.HostHub.exception.ResourseNotFoundException;
import com.example.HostHub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;

    public UserDto signUp(SignUpRequestDto signUpRequestDto){

        User user=userRepository.findByEmail(signUpRequestDto.getEmail()).orElse(null);

        if (user != null){
            throw new RuntimeException("User is already present with same email id: "+signUpRequestDto.getEmail());
        }
        User newUser=modelMapper.map(signUpRequestDto,User.class);
        newUser.setRoles(Set.of(Roles.GUEST));
        newUser.setPassword(passwordEncoder.encode(signUpRequestDto.getPassword()));
        newUser = userRepository.save(newUser);

        return modelMapper.map(newUser,UserDto.class);
    }

    public String[] login(LoginDto loginDto){
        Authentication authentication  =  authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                loginDto.getEmail(),loginDto.getPassword()
        ));

        User user = (User) authentication.getPrincipal();

        String[]arr=new String[2];
        arr[0]= jwtService.generateAccessToken(user);
        arr[1]= jwtService.generateRefreshToken(user);

        return arr;
    }

    public String refreshToken(String refreshToken){
        Long id=jwtService.getUserIdFromToken(refreshToken);
        User user=userRepository.findById(id).orElseThrow(()->new ResourseNotFoundException("User not found his id : "+id));
        return jwtService.generateAccessToken(user);
    }
}
