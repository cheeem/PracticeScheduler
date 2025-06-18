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

const groupAvailabilityJson: string | null = window.localStorage.getItem("groupAvailability");
export let groupAvailability: number[] = groupAvailabilityJson !== null ? JSON.parse(groupAvailabilityJson) : new Array(memberCount * dayCount).fill(0);
export let groupAvailabilityWeekIndex: number = 0;
const groupAvailabilityWeeks: number[][] = [
    groupAvailability, 
    new Array(memberCount * dayCount).fill(0), 
    new Array(memberCount * dayCount).fill(0), 
    new Array(memberCount * dayCount).fill(0)
];

export function weekNext() {
    groupAvailabilityWeekIndex++;

    if(groupAvailabilityWeekIndex === groupAvailability.length) {
        console.log("fetch next, push")
    }

    groupAvailability = groupAvailabilityWeeks[groupAvailabilityWeekIndex];
    //
    console.log(weekDayNumbers)
    weekDateTime += 604800000;
    weekDayNumbers = Array.from({ length: weekDayNames.length }).map((_, day) => new Date(weekDateTime + day * 86400000).getDate()); 
    console.log(weekDateTime, weekDayNumbers)
    //
    gridRender();
}

export function weekPrevious() {

    if(groupAvailabilityWeekIndex === 0) {
        return;
    }

    groupAvailability = groupAvailabilityWeeks[--groupAvailabilityWeekIndex];
    //
    weekDateTime -= 604800000;
    weekDayNumbers = Array.from({ length: weekDayNames.length }).map((_, day) => new Date(weekDateTime + day * 86400000).getDate() + 1); 
    //
    gridRender();
}

export const groupNames: string[] = [
    "zoe",
    "silver",
    "lockett",
    "lili",
    // "chuck",
];

export const groupColors: string[] = 
    Array
        .from({ length: memberCount })
        .map((_: unknown, i: number) => `hsl(${(360 / memberCount) * i}, 100%, 50%)`);

//console.log(groupColors)

// [
//     "red",
//     "green",
//     "blue",
//     "yellow",
// ];

