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

export const groupAvailability: Uint32Array[] = [
    new Uint32Array(dayCount), 
    new Uint32Array(dayCount), 
    new Uint32Array(dayCount), 
    new Uint32Array(dayCount),
    // new Uint32Array(dayCount),
];

export const groupNames: string[] = [
    "zoe",
    "silver",
    "lockett",
    "lili",
    // "chuck"
];

export const groupColors: string[] = [
    "red",
    "green",
    "blue",
    "yellow",
    // "purple"
];