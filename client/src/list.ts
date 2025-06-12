import { dayCount, weekDays, groupAvailability, timeIncrementCount } from "./data";

const list: HTMLUListElement = document.querySelector("#list ul")!;

export default function renderList() {

    list.innerHTML = "";

    const weekAvailability = new Array(dayCount).fill(0xFFFFFFFF);
    const availabilityPeriods: number[] = [];

    for(let member = 0; member < groupAvailability.length; member++) {
        for(let day = 0; day < dayCount; day++) {
            weekAvailability[day] &= groupAvailability[member][day];
        }
    }

    for(let day = 0; day < dayCount; day++) {

        const availablity = weekAvailability[day];

        if(availablity === 0) {
            continue;
        }

        let timeIncrementFirst = null;
        let timeIncrementLast = null;

        for(let timeIncrement = 0; timeIncrement < timeIncrementCount; timeIncrement++) {

            const available = (availablity >>> timeIncrement) & 1;

            if(available) {

                timeIncrementLast = timeIncrement;

                if(timeIncrementFirst === null) {
                    timeIncrementFirst = timeIncrement;
                }

            } else {

                if(timeIncrementFirst !== null) {
                    availabilityPeriods.push(day, timeIncrementFirst, timeIncrementLast as number);
                    timeIncrementFirst = null;
                }

            }

        }

    }

    for(let i = 0; i < availabilityPeriods.length; i += 3) {

        const day = availabilityPeriods[i];
        const timeIncrementFirst = availabilityPeriods[i+1];
        const timeIncrementLast = availabilityPeriods[i+2];

        const period: HTMLLIElement = document.createElement("li");
        period.innerHTML = `${weekDays[day]}\t${formatTime(timeIncrementFirst)} to ${formatTime(timeIncrementLast + 1)}`;
        list.appendChild(period);

    }

}

function formatTime(timeIncrement: number): string {

    const previousHourInMilitaryTime = 7 + (timeIncrement >> 1);
    const am = previousHourInMilitaryTime < 12;
    const hour = (previousHourInMilitaryTime % 12) + 1;

    return `${hour}:${timeIncrement & 1 ? "30" : "00"}${am ? "am" : "pm"}`;

}
