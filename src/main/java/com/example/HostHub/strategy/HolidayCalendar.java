package com.example.HostHub.strategy;

import java.time.LocalDate;
import java.time.MonthDay;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Configurable holiday calendar for pricing strategies.
 * Includes standard Indian public holidays and supports custom holiday registrations.
 */
public class HolidayCalendar {

    public enum PublicHoliday {
        NEW_YEAR(1, 1, "New Year's Day"),
        REPUBLIC_DAY(1, 26, "Republic Day"),
        LABOUR_DAY(5, 1, "May Day / Labour Day"),
        INDEPENDENCE_DAY(8, 15, "Independence Day"),
        GANDHI_JAYANTI(10, 2, "Gandhi Jayanti"),
        CHRISTMAS(12, 25, "Christmas Day"),
        NEW_YEARS_EVE(12, 31, "New Year's Eve");

        private final MonthDay monthDay;
        private final String description;

        PublicHoliday(int month, int day, String description) {
            this.monthDay = MonthDay.of(month, day);
            this.description = description;
        }

        public MonthDay getMonthDay() {
            return monthDay;
        }

        public String getDescription() {
            return description;
        }
    }

    private final Set<MonthDay> annualHolidays = new HashSet<>();
    private final Set<LocalDate> specificHolidays = new HashSet<>();

    public HolidayCalendar() {
        // Load default national/public holidays
        for (PublicHoliday holiday : PublicHoliday.values()) {
            annualHolidays.add(holiday.getMonthDay());
        }
    }

    public void addAnnualHoliday(MonthDay monthDay) {
        if (monthDay != null) {
            annualHolidays.add(monthDay);
        }
    }

    public void addSpecificHoliday(LocalDate date) {
        if (date != null) {
            specificHolidays.add(date);
        }
    }

    public boolean isHoliday(LocalDate date) {
        if (date == null) {
            return false;
        }
        return specificHolidays.contains(date) || annualHolidays.contains(MonthDay.from(date));
    }

    public Set<MonthDay> getAnnualHolidays() {
        return Collections.unmodifiableSet(annualHolidays);
    }

    public Set<LocalDate> getSpecificHolidays() {
        return Collections.unmodifiableSet(specificHolidays);
    }
}
