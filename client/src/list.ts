import { weekDays, groupNames, groupColors, groupAvailability, dayCount, timeIncrementCount } from "./data";

const lists: HTMLUListElement = document.querySelector("#lists ul")!;

export default function renderLists() {

    lists.innerHTML = "";

    const memberCount: number = groupAvailability.length;
    const members: number[] = [];
    const n: number = Math.pow(2, memberCount);

    for (let i = 0; i < n; i++) {
        members.length = 0;

        for (let j = 0; j < memberCount; j++) {
            if ((i & Math.pow(2, j))) {
                members.push(j);
            }
        }

        if (members.length > 1) {
            renderList([...members])
        }
    }

}

function renderList(members: number[]) {

    const weekAvailability: number[] = new Array(dayCount).fill(0xFFFFFFFF);
    const availabilityPeriods: number[] = [];

    for(let i = 0; i < members.length; i++) {
        const member: number = members[i];
        for(let day = 0; day < dayCount; day++) {
            weekAvailability[day] &= groupAvailability[member][day];
        }
    }

    for(let day = 0; day < dayCount; day++) {
        const dayAvailability: number = weekAvailability[day];

        if(dayAvailability === 0) {
            continue;
        }

        let timeIncrementFirst = null;
        let timeIncrementLast = null;

        for(let timeIncrement = 0; timeIncrement < timeIncrementCount; timeIncrement++) {
            const available = (dayAvailability >>> timeIncrement) & 1;

            if(available) {

                timeIncrementLast = timeIncrement;

                if(timeIncrementFirst === null) {
                    timeIncrementFirst = timeIncrement;
                }

            } else {

                if(timeIncrementFirst !== null) {
                    availabilityPeriods.push(day, timeIncrementFirst, timeIncrementLast as number);
                    timeIncrementFirst = null;
                }

            }
        }
    }

    if(availabilityPeriods.length === 0) {
        return;
    }

    const listMembersContainer: HTMLLIElement = document.createElement("li");
    const listContainer: HTMLLIElement = document.createElement("li");
    const listMembers: HTMLUListElement = document.createElement("ul")
    const list: HTMLUListElement = document.createElement("ul");

    const order: string = (groupAvailability.length - members.length).toString();

    listMembersContainer.style.order = order;
    listContainer.style.order = order;
    listMembers.className = "members";
    list.className = "list";

    for(let i = 0; i < members.length; i++) {
        const m = members[i];

        const member: HTMLLIElement = document.createElement("li");
        const memberColor: HTMLDivElement = document.createElement("div");
        const memberText: HTMLParagraphElement = document.createElement("p");

        memberColor.style.backgroundColor = groupColors[m];
        memberText.textContent = groupNames[m];

        member.appendChild(memberColor);
        member.appendChild(memberText);
        listMembers.appendChild(member);
    }

    for(let i = 0; i < availabilityPeriods.length; i += 3) {
        const day: number = availabilityPeriods[i];
        const timeIncrementFirst: number = availabilityPeriods[i+1];
        const timeIncrementLast: number = availabilityPeriods[i+2];

        const period: HTMLLIElement = document.createElement("li");
        period.textContent = `${(timeIncrementLast-timeIncrementFirst+1) / 2}hr ${weekDays[day]}\t${formatTime(timeIncrementFirst)} to ${formatTime(timeIncrementLast+1)}`;
        list.appendChild(period);
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
