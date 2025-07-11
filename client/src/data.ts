import { gridRender } from "./grid";

const decoder: TextDecoder = new TextDecoder('utf-8');

export const timeIncrementCount: number = 32;
export const dayCount: number = 7;

export const weekDayNames: string[] = [
    "Monday",
    "Tueday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

export const monthAbbreviatedNames: string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

//
const bandId: number = 1;
const bandName: string = "boxcutter facelift";
const memberId: number = 4;
const memberName: string = "chuck";
//

const bandAvailabilityWeeks: Uint32Array[] = [];
const weekDayNumberWeeks: Uint8Array[] = [];
const weekYearWeeks: number[] = []; // flattened

let weekIndex: number = 0;
let week: number;
let year: number;

export let month: number;
export let memberCount: number;
export let bandAvailability: Uint32Array;
export let weekDayNumbers: Uint8Array;
export let member: number;

export const bandMemberNames: string[] = [];
export const bandMemberIds: number[] = [];
export const bandMemberColors: string[] = [];

//console.log(bandColors)

// [
//     "red",
//     "green",
//     "blue",
//     "yellow",
// ];

export function weekNext() {
    weekIndex++;

    const button: HTMLButtonElement = document.querySelector<HTMLButtonElement>(".week-button.previous")!
    button.style.opacity = "1";
    button.style.cursor = "pointer";

    if(weekIndex === bandAvailabilityWeeks.length) {
        weekGet(weekIndex).then(gridRender)
        return;
    }

    bandAvailability = bandAvailabilityWeeks[weekIndex];
    weekDayNumbers = weekDayNumberWeeks[weekIndex];
    week = weekYearWeeks[weekIndex];
    year = weekYearWeeks[weekIndex+1];
    gridRender();
}

export function weekPrevious() {
    if(weekIndex === 0) {
        return;
    }

    weekIndex--;

    if(weekIndex === 0) {
        const button: HTMLButtonElement = document.querySelector<HTMLButtonElement>(".week-button.previous")!
        button.style.opacity = "0.3";
        button.style.cursor = "not-allowed";
    }

    bandAvailability = bandAvailabilityWeeks[weekIndex];
    weekDayNumbers = weekDayNumberWeeks[weekIndex];
    week = weekYearWeeks[weekIndex];
    year = weekYearWeeks[weekIndex+1];
    gridRender();
}

function GenerateBandColors() {
    for(let m = 0; m < memberCount; m++) {
        bandMemberColors[m] = `hsl(${(360 / memberCount) * m}, 100%, 50%)`
    }
    bandMemberColors.length = memberCount;
}

export async function bandMembersGet() {
    return fetch(`http://localhost:8080/band/members/get/${bandId}`)
        .then((res: Response) => res 
        .arrayBuffer()
        .then(bandMemberRead));
}

function bandMemberRead(buf: ArrayBuffer) {
    const view: DataView = new DataView(buf);
    memberCount = view.getUint8(0);
    GenerateBandColors();
    
    let nextByte = 1;
    for(let m = 0; m < memberCount; m++) {
        const id: number = view.getUint32(nextByte, true);
        const len: number = view.getUint8(nextByte+4);
        const name = decoder.decode(new Uint8Array(buf).subarray(nextByte+5, nextByte+5+len));
        
        bandMemberIds[m] = id
        bandMemberNames[m] = name;
        nextByte += 5+len

        if(memberId === id) {
            member = m;
        }
    }

    bandMemberIds.length = memberCount;
    bandMemberNames.length = memberCount;
}

export function bandMemberRemove(memberId: number, legendKey: HTMLLIElement) {
    // TODO:
    console.log("remove member with id:" + memberId)
}

export async function weekGet(offset: number) {
    return fetch(`http://localhost:8080/week/get/${bandId}/${offset}`)
        .then((res: Response) => res
        .arrayBuffer()
        .then(weekRead));
}

function weekRead(buf: ArrayBuffer) {
    const view: DataView = new DataView(buf);
    week = view.getUint8(0);
    month = view.getUint8(1);
    year = view.getInt16(2, true);
    memberCount = view.getUint8(4);
    // GenerateBandColors();

    weekDayNumbers = new Uint8Array(buf, 5, 7);
    bandAvailability = new Uint32Array(buf, 12);

    weekYearWeeks[weekIndex * 2] = week;
    weekYearWeeks[weekIndex * 2 + 1] = year;
    weekDayNumberWeeks[weekIndex] = weekDayNumbers
    bandAvailabilityWeeks[weekIndex] = bandAvailability
}

export async function weekSet() {
    return fetch(`http://localhost:8080/week/set/${bandId}/${memberId}/${week}/${year}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/octet-stream" },
        body: new Uint8Array(bandAvailability.buffer, 12 + member * dayCount * 4, dayCount * 4)
    });
}