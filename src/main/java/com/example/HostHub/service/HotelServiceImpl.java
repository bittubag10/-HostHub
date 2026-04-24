package com.example.HostHub.service;

import com.example.HostHub.dto.HotelDTO;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.exception.ResourseNotFoundException;
import com.example.HostHub.repository.HotelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class HotelServiceImpl implements HotelService{

    private final HotelRepository hotelRepository;
    private final ModelMapper modelMapper;

    @Override
    public HotelDTO createNewHotel(HotelDTO hotelDTO) {
        log.info("Creating a new hotel with name : {}",hotelDTO.getName());
        Hotel hotel=modelMapper.map(hotelDTO,Hotel.class);
        hotel.setActive(false);
        hotel =hotelRepository.save(hotel);
        log.info("Created a new hotel with id : {}",hotelDTO.getId());
        return modelMapper.map(hotel,HotelDTO.class);
    }

    @Override
    public HotelDTO getHotelById(Long id) {
        log.info("Getting the hotel with id: {}",id);
        Hotel hotel=hotelRepository.findById(id)
                .orElseThrow(()->new ResourseNotFoundException("Hotel not found with id: "+id));

        return modelMapper.map(hotel,HotelDTO.class);

    }

    @Override
    public HotelDTO updateHotelById(Long id, HotelDTO hotelDTO) {
        log.info("updating the hotel with id: {}",id);
        Hotel hotel=hotelRepository.findById(id)
                .orElseThrow(()->new ResourseNotFoundException("Hotel not found with id: "+id));
        modelMapper.map(hotelDTO,hotel);
        hotel.setId(id);
       hotel= hotelRepository.save(hotel);
       return modelMapper.map(hotel,HotelDTO.class);
    }

    @Override
    public void deleteHotelById(Long id) {
        boolean exist=hotelRepository.existsById(id);
        if (!exist){
            throw new ResourseNotFoundException("Hotel not found with id : "+id);

        }

        hotelRepository.deleteById(id);

    }

    @Override
    public void activateHotel(Long hotelId) {

        log.info("Activating the hotel with id: {}",hotelId);
        Hotel hotel=hotelRepository.findById(hotelId)
                .orElseThrow(()->new ResourseNotFoundException("Hotel not found with id: "+hotelId));

        hotel.setActive(true);
    }
}
