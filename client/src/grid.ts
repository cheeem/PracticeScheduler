import { dayCount, timeIncrementCount, groupAvailability, groupColors, groupNames } from "./data.ts";
import renderList from "./list.ts"

const grid: HTMLUListElement = document.querySelector("#grid .body")!;
const labels: HTMLUListElement = document.querySelector("#grid .labels")!;
const legend: HTMLUListElement = document.querySelector("#grid .legend ul")!;
const groupGridElements: HTMLDivElement[][] = initializeGroupGridElements(groupAvailability.length, dayCount, timeIncrementCount);

let notEditing: boolean = true;
let rightClickEdit: boolean = false;

let availableStart: number = 0; // boolean number, 0 or 1
let dayStart: number = 0;
let timeIncrementStart: number = 0;

let editingDirectionPrevious: number | null = null; // boolean number, 0 or 1
let dayPrevious: number | null = null;
let timeIncrementPrevious: number | null = null;

export default function renderGrid(member: number) {

    const gridElements: HTMLDivElement[] = groupGridElements[member];
    const weekAvailability: Uint32Array = groupAvailability[member];
    const color: string = groupColors[member];

    document.addEventListener("mouseup", documentMouseUp);
    grid.ondragstart = () => false;
    grid.innerHTML = "";
    labels.innerHTML = "";
    legend.innerHTML = "";

    let hour: number = 8;
    let am: boolean = true;

    for(let timeIncrement = 0; timeIncrement < timeIncrementCount; timeIncrement++) {

        if((timeIncrement & 1) == 0) {
            const label: HTMLLIElement = document.createElement("li")!;
            label.textContent = `${hour}:00${am ? "am" : "pm"}`;
            labels.appendChild(label);
            hour = (hour % 12) + 1;

            if(hour === 12) {
                am = !am;
            }
        }

        for(let day = 0; day < dayCount; day++) {
            const node: HTMLLIElement = document.createElement("li")!;
            node.style.gridTemplateColumns = `repeat(${groupAvailability.length}, 1fr)`;
            node.addEventListener("mousedown", gridMouseDown.bind(null, weekAvailability, color, day, timeIncrement, gridElements));
            node.addEventListener("mouseover", gridMouseOver.bind(null, weekAvailability, color, day, timeIncrement, gridElements));
            node.addEventListener("contextmenu", gridContextMenu);
            const gridElementIndex: number = timeIncrement * dayCount + day;
            for(let m = 0; m < groupAvailability.length; m++) {
                const marker = document.createElement("div");
                const available: number = groupAvailability[m][day] & (1 << timeIncrement);
                marker.style.backgroundColor = available ? `${groupColors[m]}` : "lightgrey";
                if(member !== m) {
                    marker.style.opacity = "0.3";
                }
                groupGridElements[m][gridElementIndex] = marker;
                node.appendChild(marker);
            }
            grid.appendChild(node);
        }
    }

    const label: HTMLLIElement = document.createElement("li")!;
    label.textContent = `${hour}:00${am ? "am" : "pm"}`;
    labels.appendChild(label);

    for(let m = 0; m < groupNames.length; m++) {
        const legendKey: HTMLLIElement = document.createElement("li")!;
        legendKey.textContent = groupNames[m];
        //
        if(member === m) {
            legendKey.style.color = "red";
        }
        legendKey.addEventListener("click", () => {
            renderGrid(m);
        });
        //
        legend.appendChild(legendKey);
    }

}

function gridMouseDown(weekAvailability: Uint32Array, color: string, day: number, timeIncrement: number, gridElements: HTMLDivElement[]) {

    if(rightClickEdit) {
        return;
    }

    weekAvailability[day] ^= (1 << timeIncrement);
                
    const available: number = (weekAvailability[day] >>> timeIncrement) & 1;
    gridElements[timeIncrement * dayCount + day].style.backgroundColor = available ? `${color}` : "lightgrey";

    notEditing = false;
    availableStart = available;
    dayStart = day;
    timeIncrementStart = timeIncrement;

    editingDirectionPrevious = null;
    dayPrevious = null;
    timeIncrementPrevious = null;

    renderList();
}

function gridMouseOver(weekAvailability: Uint32Array, color: string, day: number, timeIncrement: number, gridElements: HTMLDivElement[]) {

    if(notEditing) {
        return;
    }

    if(timeIncrementPrevious !== null && dayPrevious !== null) {

        const editingDirection: number = Math.sign(timeIncrement - timeIncrementPrevious);
            
        if(editingDirection !== 0) {

            const directionChanged: boolean = editingDirectionPrevious !== null && editingDirection !== editingDirectionPrevious;

            if(directionChanged) {
                availableStart = availableStart ^ 1;
                dayStart = dayPrevious;
                timeIncrementStart = timeIncrementPrevious;
            }

            editingDirectionPrevious = editingDirection;
            
        }

    }

    let timeIncrementMin: number;
    let timeIncrementMax: number;

    if(timeIncrement > timeIncrementStart) {
        timeIncrementMax = timeIncrement;
        timeIncrementMin = timeIncrementStart;
    } else {
        timeIncrementMax = timeIncrementStart;
        timeIncrementMin = timeIncrement;
    }

    let dayMin: number;
    let dayMax: number;

    if(day > dayStart) {
        dayMax = day;
        dayMin = dayStart;
    } else {
        dayMax = dayStart;
        dayMin = day;
    }

    const mask = (0x80000000 >> (timeIncrementMax - timeIncrementMin)) >>> (timeIncrementCount - timeIncrementMax - 1);

    for(let d = dayMin; d <= dayMax; d++) {
        if(availableStart) {
            weekAvailability[d] |= mask;
            for(let i = timeIncrementMin; i <= timeIncrementMax; i++) {
                gridElements[i * dayCount + d].style.backgroundColor = `${color}`;
            }
        } else {
            weekAvailability[d] &= ~mask;
            for(let i = timeIncrementMin; i <= timeIncrementMax; i++) {
                gridElements[i * dayCount + d].style.backgroundColor = "lightgrey";
            }
        }
    }

    timeIncrementPrevious = timeIncrement;
    dayPrevious = day;

    renderList();
}

function gridContextMenu(e: MouseEvent) {
    e.preventDefault();
    notEditing = rightClickEdit;
    rightClickEdit = !rightClickEdit;
}


function documentMouseUp() {
    notEditing = !rightClickEdit;
}

function initializeGroupGridElements(len: number, dayCount: number, timeIncrementCount: number) {
    const groupGridElements: HTMLDivElement[][] = new Array(len);
    for(let i = 0; i < len; i++) {
        groupGridElements[i] = new Array(timeIncrementCount * dayCount);
    }
    return groupGridElements;
}