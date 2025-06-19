import { weekDayNames, memberCount, dayCount, timeIncrementCount, bandNames, bandColors, bandAvailability, } from "./data";

const lists: HTMLUListElement = document.querySelector("#lists ul")!;

export default function listsRender() {

    lists.innerHTML = "";

    const members: number[] = new Array(memberCount);
    const n: number = Math.pow(2, memberCount);

    for (let i = 0; i < n; i++) {
        members.length = 0;

        for (let j = 0; j < memberCount; j++) {
            if ((i & Math.pow(2, j))) {
                members.push(j);
            }
        }

        if (members.length > 1) {
            listCompute(members);
        }
    }

}

function listCompute(members: number[]) {

    const weekAvailability: number[] = new Array(dayCount).fill(0xFFFFFFFF);
    const availabilityPeriods: number[] = [];

    for(let i = 0; i < members.length; i++) {
        const member: number = members[i];
        for(let day = 0; day < dayCount; day++) {
            weekAvailability[day] &= bandAvailability[member * dayCount + day];
        }
    }

    for(let day = 0; day < dayCount; day++) {
        const dayAvailability: number = weekAvailability[day];

        if(dayAvailability === 0) {
            continue;
        }

        let timeIncrementStart: number | null = null;
        let timeIncrementEnd: number | null = null;

        for(let timeIncrement = 0; timeIncrement < timeIncrementCount; timeIncrement++) {
            const available = (dayAvailability >>> timeIncrement) & 1;

            if(available) {

                timeIncrementEnd = timeIncrement;

                if(timeIncrementStart === null) {
                    timeIncrementStart = timeIncrement;
                }

            } else {

                if(timeIncrementStart !== null) {
                    availabilityPeriods.push(day, timeIncrementStart, timeIncrementEnd! + 1);
                    timeIncrementStart = null;
                }

            }
        }
    }

    if(availabilityPeriods.length > 0) {
        listRender(members, availabilityPeriods);
    }

}

function listRender(members: number[], availabilityPeriods: number[]) {

    const listMembersContainer: HTMLLIElement = document.createElement("li");
    const listContainer: HTMLLIElement = document.createElement("li");
    const listMembers: HTMLUListElement = document.createElement("ul")
    const list: HTMLUListElement = document.createElement("ul");

    const order: string = (memberCount - members.length).toString();

    listMembersContainer.style.order = order;
    listContainer.style.order = order;
    listMembers.className = "members";
    list.className = "list";

    for(let i = 0; i < members.length; i++) {
        const m = members[i];

        const member: HTMLLIElement = document.createElement("li");
        const memberColor: HTMLDivElement = document.createElement("div");
        const memberText: HTMLParagraphElement = document.createElement("p");

        memberColor.style.backgroundColor = bandColors[m];
        memberText.textContent = bandNames[m];

        member.appendChild(memberColor);
        member.appendChild(memberText);
        listMembers.appendChild(member);
    }

    for(let i = 0; i < availabilityPeriods.length; i += 3) {
        const day: number = availabilityPeriods[i];
        const timeIncrementStart: number = availabilityPeriods[i+1];
        const timeIncrementEnd: number = availabilityPeriods[i+2];

        const periodHours: HTMLLIElement = document.createElement("li");
        const periodDay: HTMLLIElement = document.createElement("li");
        const periodTimeStart: HTMLLIElement = document.createElement("li");
        const periodTimeEnd: HTMLLIElement = document.createElement("li");

        periodHours.className = "hours";
        periodHours.textContent = `${(timeIncrementEnd-timeIncrementStart) / 2}hr`;
        periodDay.className = "day";
        periodDay.textContent = weekDayNames[day];
        periodTimeStart.className = "start";
        periodTimeStart.textContent = formatTime(timeIncrementStart);
        periodTimeEnd.className = "end";
        periodTimeEnd.textContent = formatTime(timeIncrementEnd);

        // periodHours.textContent = `${(timeIncrementEnd-timeIncrementStart) / 2}hr ${weekDays[day]}\t${formatTime(timeIncrementStart)} to ${formatTime(timeIncrementEnd)}`;
        
        list.appendChild(periodHours);
        list.appendChild(periodDay);
        list.appendChild(periodTimeStart);
        list.appendChild(periodTimeEnd);
    }


    listMembersContainer.appendChild(listMembers)
    listContainer.appendChild(list);
    lists.appendChild(listMembersContainer);
    lists.appendChild(listContainer);

}


function formatTime(timeIncrement: number): string {

    const previousHourInMilitaryTime: number = 7 + (timeIncrement >> 1);
    const hour: number = (previousHourInMilitaryTime % 12) + 1;
    const am: boolean = previousHourInMilitaryTime < 12;

    return `${hour}:${timeIncrement & 1 ? "30" : "00"}${am ? "am" : "pm"}`;

}
