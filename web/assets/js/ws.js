const MEETINGS_SERVICE = "https://zndjfudjbjesrnmvedn2rvpoaa.appsync-api.eu-central-1.amazonaws.com/graphql";
const REGION = "eu-central-1"
const API_KEY = "da2-xy5anpjp35b67bwhlms4ym665m"

var current_url = document.URL;
console.log(current_url.replace("operator", "index"));

async function fetchMeetings() {
    const query = `query MyQuery {
        allMeetings(fleet_operator: "UBER") {
          items {
            answer_time
            answered_by
            id
            start_time
            fleet_operator
            started_by
          }
        }
      }`;

    var response = await fetch(MEETINGS_SERVICE, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            // 'aws_appsync_region':  REGION,
            // 'aws_appsync_authenticationType': "apiKey",
            "x-api-key":  API_KEY
        },
        body: JSON.stringify({query})

    });

    const responseBody = await response.json();
    console.log(responseBody);

    const tableBody = document.querySelector('#itemsTable tbody');

    responseBody.data.allMeetings.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${item.id}</td>`;
        row.innerHTML += `<td>${item.started_by}</td>`;
        row.innerHTML += `<td>${item.fleet_operator}</td>`;
        row.innerHTML += `<td>${item.start_time}</td>`;
        
        if (item.end_time != null){
            row.innerHTML += `<td>${item.end_time}</td>`;
        }
        else{
            row.innerHTML += `<td></td>`;
        }

        if (item.answered_by != null){
            row.innerHTML += `<td>${item.answered_by}</td>`;
            row.innerHTML += `<td>${item.answer_time}</td>`;
            row.innerHTML += `<td></td>`;
        }
        else{
            row.innerHTML += `<td></td>`;
            row.innerHTML += `<td></td>`;
            if (item.end_time != null){
                row.innerHTML += `<td></td>`;
            }
            else{
            row.innerHTML += `<td><a target="_blank" href="${current_url.replace("operator", "index")}?meetingId=${item.id}">Join</a></td>`;
            }
        }
        tableBody.appendChild(row);
    });
}
window.addEventListener("DOMContentLoaded", () => {
    fetchMeetings();
});