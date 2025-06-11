import './style.css';

const timeIncrementCount: number = 32;
const dayCount: number = 7;

renderGrid();

function renderGrid() {

    const grid: HTMLUListElement = document.querySelector("#grid")!;
    const gridElements: HTMLLIElement[] = new Array(timeIncrementCount * dayCount);

    const weekAvailability: Uint32Array = new Uint32Array(dayCount);
    let notEditing: boolean = true;

    let availableStart: number = 0; // boolean number, 0 or 1
    let dayStart: number = 0;
    let timeIncrementStart: number = 0;
    
    let editingDirectionPrevious: number | null = null; // boolean number, 0 or 1
    let dayPrevious: number = 0;
    let timeIncrementPrevious: number = 0;

    document.addEventListener("mouseup", () => notEditing = true);
    grid.ondragstart = () => false;

    // (e.currentTarget as HTMLLIElement).style = available ? "background-color: green" : "background-color: lightgrey";

    for(let timeIncrement = 0; timeIncrement < timeIncrementCount; timeIncrement++) {
        for(let day = 0; day < dayCount; day++) {
            const element: HTMLLIElement = document.createElement("li")!;
            const available: number = weekAvailability[day] & (1 << timeIncrement);
            element.style = available ? "background-color: green" : "background-color: lightgrey";
            gridElements[timeIncrement * dayCount + day] = element;
            grid.appendChild(element);

            element.addEventListener("mousedown", (e: MouseEvent) => {
                weekAvailability[day] ^= (1 << timeIncrement);
                
                const available: number = (weekAvailability[day] >>> timeIncrement) & 1;
                (e.currentTarget as HTMLLIElement).style = available ? "background-color: green" : "background-color: lightgrey";

                notEditing = false;
                availableStart = available;
                dayStart = day;
                timeIncrementStart = timeIncrement;
            });

            element.addEventListener("mouseover", (e: MouseEvent) => {

                if(notEditing) {
                    return;
                }

                //  if the day is the same and the direction changes
                //      toggle availability
                //      set start day to the previous day
                //      set start time increment to the previous time increment
                if(day === dayPrevious) {
                    const editingDirection: number = (timeIncrement - timeIncrementPrevious) >>> 31;

                    if(editingDirectionPrevious !== null && editingDirection !== editingDirectionPrevious) {
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

            });
        }
    }

}