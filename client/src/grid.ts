export const timeIncrementCount: number = 32;
export const dayCount: number = 7;

const gridElements: HTMLLIElement[] = new Array(timeIncrementCount * dayCount);

const weekAvailability: Uint32Array = new Uint32Array(dayCount);
let notEditing: boolean = true;
let rightClickEdit: boolean = false;

let availableStart: number = 0; // boolean number, 0 or 1
let dayStart: number = 0;
let timeIncrementStart: number = 0;

let editingDirectionPrevious: number | null = null; // boolean number, 0 or 1
let dayPrevious: number = 0;
let timeIncrementPrevious: number = 0;

export default function renderGrid() {

    const grid: HTMLUListElement = document.querySelector("#grid .content")!;
    const labels: HTMLUListElement = document.querySelector("#grid .labels")!;

    document.addEventListener("mouseup", documentMouseUp);
    grid.ondragstart = () => false;

    let hour: number = 8;
    let am: boolean = true;

    for(let timeIncrement = 0; timeIncrement < timeIncrementCount; timeIncrement++) {

        if((timeIncrement & 1) == 0) {
            const element: HTMLLIElement = document.createElement("li")!;
            element.textContent = `${hour}:00${am ? "am" : "pm"}`;
            labels.appendChild(element);
            hour = (hour % 12) + 1;

            if(hour === 12) {
                am = !am;
            }
        }

        for(let day = 0; day < dayCount; day++) {
            const element: HTMLLIElement = document.createElement("li")!;
            const available: number = weekAvailability[day] & (1 << timeIncrement);
            element.style = available ? "background-color: green" : "background-color: lightgrey";
            element.addEventListener("mousedown", gridMouseDown.bind(null, day, timeIncrement));
            element.addEventListener("mouseover", gridMouseOver.bind(null, day, timeIncrement));
            element.addEventListener("contextmenu", gridContextMenu);
            gridElements[timeIncrement * dayCount + day] = element;
            grid.appendChild(element);
        }
    }

    const element: HTMLLIElement = document.createElement("li")!;
    element.textContent = `${hour}:00${am ? "am" : "pm"}`;
    labels.appendChild(element);

}

function gridMouseDown(day: number, timeIncrement: number, e: MouseEvent) {

    if(rightClickEdit) {
        return;
    }

    weekAvailability[day] ^= (1 << timeIncrement);
                
    const available: number = (weekAvailability[day] >>> timeIncrement) & 1;
    (e.currentTarget as HTMLLIElement).style = available ? "background-color: green" : "background-color: lightgrey";

    notEditing = false;
    availableStart = available;
    dayStart = day;
    timeIncrementStart = timeIncrement;
}

function gridMouseOver(day: number, timeIncrement: number) {

    if(notEditing) {
        return;
    }

    if(day === dayPrevious) {
        const editingDirection: number = (timeIncrement - timeIncrementPrevious) >>> 31;
        const directionChanged: boolean = editingDirectionPrevious !== null && editingDirection !== editingDirectionPrevious;

        if(directionChanged) {
            availableStart = availableStart ^ 1;
            dayStart = dayPrevious;
            timeIncrementStart = timeIncrementPrevious;
        }

        editingDirectionPrevious = editingDirection;
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
                gridElements[i * dayCount + d].style = "background-color: green";
            }
        } else {
            weekAvailability[d] &= ~mask;
            for(let i = timeIncrementMin; i <= timeIncrementMax; i++) {
                gridElements[i * dayCount + d].style = "background-color: lightgrey";
            }
        }
    }

    timeIncrementPrevious = timeIncrement;
    dayPrevious = day;
}

function gridContextMenu(e: MouseEvent) {
    e.preventDefault();
    notEditing = rightClickEdit;
    rightClickEdit = !rightClickEdit;
}


function documentMouseUp() {
    notEditing = !rightClickEdit;
    editingDirectionPrevious = null;
}