import { 
    weekDayNames, 
    weekDayNumbers, 
    memberCount, 
    dayCount, 
    timeIncrementCount, 
    bandAvailability, 
    bandMemberColors, 
    bandMemberNames, 
    bandMemberIds,
    member,
    weekNext, 
    weekPrevious, 
    weekSet,
    bandMemberRemove,
} from "./data.ts";
import listsRender from "./lists.ts";

let bandGridElements: HTMLDivElement[];
let weekDayNumberElements: HTMLParagraphElement[];

let notEditing: boolean = true;
let rightClickEdit: boolean = false;

let availableStart: number = 0; // boolean number, 0 or 1
let dayStart: number = 0;
let timeIncrementStart: number = 0;

let editingDirectionPrevious: number | null = null; // boolean number, 0 or 1
let dayPrevious: number | null = null;
let timeIncrementPrevious: number | null = null;

function documentMouseUp() {
    notEditing = !rightClickEdit;
}

export default function gridInitialize() {

    bandGridElements = new Array(memberCount * dayCount * timeIncrementCount);
    weekDayNumberElements = new Array(dayCount);

    const grid: HTMLUListElement = document.querySelector("#grid .body")!;
    // const labels: HTMLUListElement = document.querySelector("#grid .labels")!;

    document.addEventListener("mouseup", documentMouseUp);
    grid.ondragstart = () => false;

    //let hour: number = 8;
    //let am: boolean = true;

    weekInitialize(grid);

    for(let timeIncrement = 0; timeIncrement < timeIncrementCount; timeIncrement++) {

        const odd = timeIncrement & 1;

        // if(!odd) {
        //     const label: HTMLLIElement = document.createElement("li");
        //     label.textContent = `${hour}:00${am ? "am" : "pm"}`;
        //     labels.appendChild(label);

        //     hour = (hour % 12) + 1;

        //     if(hour === 12) {
        //         am = !am;
        //     }
        // }

        for(let day = 0; day < dayCount; day++) {

            const node: HTMLLIElement = document.createElement("li");

            if(odd) {
                node.className = "odd";
            }

            node.style.gridTemplateColumns = `repeat(${memberCount}, 1fr)`;
            node.addEventListener("mousedown", gridMouseDown.bind(null, day, timeIncrement));
            node.addEventListener("mouseover", gridMouseOver.bind(null, day, timeIncrement));
            node.addEventListener("contextmenu", gridContextMenu);

            for(let m = 0; m < memberCount; m++) {
                const marker = document.createElement("div");
                const available: number = bandAvailability[m * dayCount + day] & (1 << timeIncrement);

                marker.style.backgroundColor = available ? bandMemberColors[m] : "lightgrey";

                bandGridElements[(m * dayCount + day) * timeIncrementCount + timeIncrement] = marker;
                node.appendChild(marker);
            }

            grid.appendChild(node);

        }
    }

    // const label: HTMLLIElement = document.createElement("li");
    // label.textContent = `${hour}:00${am ? "am" : "pm"}`;
    // labels.appendChild(label);

    legendInitialize();

    listsRender();

}

export function gridRender() {

    for(let d = 0; d < dayCount; d++) {
        weekDayNumberElements[d].textContent = weekDayNumbers[d].toString();
    }
    
    for(let m = 0; m < memberCount; m++) {
        for(let d = 0; d < dayCount; d++) {
            for(let i = 0; i < timeIncrementCount; i++) {
                const marker: HTMLDivElement = bandGridElements[(m * dayCount + d) * timeIncrementCount + i];
                const available: number = bandAvailability[m * dayCount + d] & (1 << i);

                marker.style.backgroundColor = available ? bandMemberColors[m] : "lightgrey";
                // if(member !== m) {
                //     marker.style.opacity = "0.2";
                // }
            }
        }
    }

    listsRender(); 

}

function gridMouseDown(day: number, timeIncrement: number) {

    if(rightClickEdit) {
        return;
    }

    bandAvailability[member * dayCount + day] ^= (1 << timeIncrement);
                
    const available: number = (bandAvailability[member * dayCount + day] >>> timeIncrement) & 1;
    bandGridElements[(member * dayCount + day) * timeIncrementCount + timeIncrement].style.backgroundColor = available ? bandMemberColors[member] : "lightgrey";

    notEditing = false;
    availableStart = available;
    dayStart = day;
    timeIncrementStart = timeIncrement;

    editingDirectionPrevious = null;
    dayPrevious = null;
    timeIncrementPrevious = null;

    weekSet();
    listsRender();
}

function gridMouseOver(day: number, timeIncrement: number) {

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
            bandAvailability[member * dayCount + d] |= mask;
            for(let i = timeIncrementMin; i <= timeIncrementMax; i++) {
                bandGridElements[(member * dayCount + d) * timeIncrementCount + i].style.backgroundColor = bandMemberColors[member];
            }
        } else {
            bandAvailability[member * dayCount + d] &= ~mask;
            for(let i = timeIncrementMin; i <= timeIncrementMax; i++) {
                bandGridElements[(member * dayCount + d) * timeIncrementCount + i].style.backgroundColor = "lightgrey";
            }
        }
    }

    timeIncrementPrevious = timeIncrement;
    dayPrevious = day;

    weekSet();
    listsRender();
}

function gridContextMenu(e: MouseEvent) {
    e.preventDefault();
    notEditing = rightClickEdit;
    rightClickEdit = !rightClickEdit;
}

function weekInitialize(grid: HTMLUListElement) {
    const firstWeekDay = weekDayInitialize(grid, 0);
    const weekPreviousButton = document.createElement("button");
    weekPreviousButton.className = "week-button previous";
    weekPreviousButton.textContent = "<";
    weekPreviousButton.style.opacity = "0.3";
    weekPreviousButton.style.cursor = "not-allowed";
    weekPreviousButton.addEventListener("click", weekPrevious)
    firstWeekDay.appendChild(weekPreviousButton);

    for(let day = 1; day < dayCount - 1; day++) {
        weekDayInitialize(grid, day);
    }

    const lastWeekDay = weekDayInitialize(grid, dayCount - 1);
    const weekNextButton = document.createElement("button");
    weekNextButton.className = "week-button next";
    weekNextButton.textContent = ">";
    weekNextButton.addEventListener("click", weekNext)
    lastWeekDay.appendChild(weekNextButton);
}

function weekDayInitialize(grid: HTMLUListElement, day: number): HTMLLIElement {

    const weekDay: HTMLLIElement = document.createElement("li");
    const weekDayNumber: HTMLParagraphElement = document.createElement("p");
    const weekDayName: HTMLParagraphElement = document.createElement("p");

    weekDay.className = "day";
    weekDayNumber.className = "number";
    weekDayNumber.textContent = weekDayNumbers[day].toString();
    weekDayName.className = "name";
    weekDayName.textContent = weekDayNames[day].slice(0, 3);

    weekDayNumberElements[day] = weekDayNumber;

    weekDay.appendChild(weekDayNumber);
    weekDay.appendChild(weekDayName);
    grid.appendChild(weekDay);

    return weekDay;

}

function legendInitialize() {

    const legend: HTMLUListElement = document.querySelector("#grid .legend ul")!;

    for(let m = 0; m < bandMemberNames.length; m++) {

        const legendKey: HTMLLIElement = document.createElement("li");
        const legendKeyColor: HTMLDivElement = document.createElement("div");
        const legendKeyText: HTMLParagraphElement = document.createElement("p");

        legendKeyColor.style.backgroundColor = bandMemberColors[m];
        legendKeyText.textContent = bandMemberNames[m];

        legendKey.addEventListener("click", bandMemberRemove.bind(null, bandMemberIds[m], legendKey))

        legendKey.appendChild(legendKeyColor);
        legendKey.appendChild(legendKeyText);
        legend.appendChild(legendKey);
    }

}