export const timeIncrementCount: number = 32;
export const dayCount: number = 7;

export const weekDays: string[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

const groupAvailabilityJson = window.localStorage.getItem("groupAvailability");
export const groupAvailability: number[][] = groupAvailabilityJson !== null ? JSON.parse(groupAvailabilityJson) : [
    new Array(dayCount).fill(0), 
    new Array(dayCount).fill(0), 
    new Array(dayCount).fill(0), 
    new Array(dayCount).fill(0),
];
export function saveGrid() {
    window.localStorage.setItem("groupAvailability", JSON.stringify(groupAvailability));
}

export const groupNames: string[] = [
    "zoe",
    "silver",
    "lockett",
    "lili",
];

export const groupColors: string[] = [
    "red",
    "green",
    "blue",
    "yellow",
];