const MEETINGS_SERVICE = "https://hhs9rhcuo8.execute-api.eu-central-1.amazonaws.com/prod/meetings";

var current_url = document.URL;
console.log(current_url.replace("operator", "index"));

async function fetchMeetings() {
    var response = await fetch(MEETINGS_SERVICE+ "?operator=UBER", {
        method: "GET",
        headers: new Headers(),
    });

    const data = await response.json();
    console.log(data);

    const tableBody = document.querySelector('#itemsTable tbody');

    data.Items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${item.id.S}</td>
        <td>${item.started_by.S}</td>
        <td>${item.fleet_operator.S}</td>
        <td>${item.start_time.S}</td>
        `;
        if (item.hasOwnProperty('answered_by')){
            row.innerHTML += `
                                <td>${item.answered_by.S}</td>
                                <td>${item.answer_time.S}</td>
                                <td></td>
                            `;
        }
        else{
            row.innerHTML += `
            <td></td>
            <td></td>
            <td><a target="_blank" href="${current_url.replace("operator", "index")}?meetingId=${item.id.S}">Join</a></td>
        `;
        }
        tableBody.appendChild(row);
    });
}
window.addEventListener("DOMContentLoaded", () => {
    fetchMeetings();
});