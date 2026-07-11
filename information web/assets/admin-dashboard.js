import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const tableBody = document.getElementById("youthTableBody");

async function loadYouth() {

    tableBody.innerHTML = "";

    const snapshot = await getDocs(collection(db, "users"));

    snapshot.forEach((doc) => {

        const user = doc.data();

        if (user.role === "youth") {

            tableBody.innerHTML += `
            <tr>
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>${user.age}</td>
                <td>${user.gender}</td>
                <td>${user.education}</td>
                <td>${user.employment}</td>
                <td>Active</td>

                <td>
                    <button>Edit</button>
                    <button>Delete</button>
                </td>
            </tr>
            `;
        }

    });

}

loadYouth();