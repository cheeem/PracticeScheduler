import "./style.css";
import { bandMembersGet, weekGet } from "./data.ts"
import gridInitialize from "./grid.ts";

// localStorage.clear();
bandMembersGet()
    .then(weekGet.bind(null, 0))
    .then(gridInitialize);