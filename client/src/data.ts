export const timeIncrementCount: number = 32;
export const dayCount: number = 7;
export const memberCount: number = 4;

export const weekDays: string[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

const groupAvailabilityJson: string | null = window.localStorage.getItem("groupAvailability");
export const groupAvailability: number[] = groupAvailabilityJson !== null ? JSON.parse(groupAvailabilityJson) : new Array(memberCount * dayCount).fill(0);

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

