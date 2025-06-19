import { gridRender } from "./grid";

export const timeIncrementCount: number = 32;
export const dayCount: number = 7;
export const memberCount: number = 4;

export let weekDateTime: number = new Date("2025-06-16").getTime();

export const weekDayNames: string[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

export let weekDayNumbers: number[] = Array.from({ length: weekDayNames.length }).map((_, day) => new Date(weekDateTime + day * 86400000).getDate() + 1);

const bandAvailabilityJson: string | null = window.localStorage.getItem("bandAvailability");
export let bandAvailability: number[] = bandAvailabilityJson !== null ? JSON.parse(bandAvailabilityJson) : new Array(memberCount * dayCount).fill(0);
export let bandAvailabilityWeekIndex: number = 0;
const bandAvailabilityWeeks: number[][] = [
    bandAvailability, 
    new Array(memberCount * dayCount).fill(0), 
    new Array(memberCount * dayCount).fill(0), 
    new Array(memberCount * dayCount).fill(0)
];

export function weekNext() {
    bandAvailabilityWeekIndex++;

    if(bandAvailabilityWeekIndex === bandAvailability.length) {
        console.log("fetch next, push")
    }

    bandAvailability = bandAvailabilityWeeks[bandAvailabilityWeekIndex];
    //
    console.log(weekDayNumbers)
    weekDateTime += 604800000;
    weekDayNumbers = Array.from({ length: weekDayNames.length }).map((_, day) => new Date(weekDateTime + day * 86400000).getDate()); 
    console.log(weekDateTime, weekDayNumbers)
    //
    gridRender();
}

export function weekPrevious() {

    if(bandAvailabilityWeekIndex === 0) {
        return;
    }

    bandAvailability = bandAvailabilityWeeks[--bandAvailabilityWeekIndex];
    //
    weekDateTime -= 604800000;
    weekDayNumbers = Array.from({ length: weekDayNames.length }).map((_, day) => new Date(weekDateTime + day * 86400000).getDate() + 1); 
    //
    gridRender();
}

export const bandNames: string[] = [
    "zoe",
    "silver",
    "lockett",
    "lili",
    // "chuck",
];

export const bandColors: string[] = 
    Array
        .from({ length: memberCount })
        .map((_: unknown, i: number) => `hsl(${(360 / memberCount) * i}, 100%, 50%)`);

//console.log(bandColors)

// [
//     "red",
//     "green",
//     "blue",
//     "yellow",
// ];

