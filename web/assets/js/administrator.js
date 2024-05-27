const MEETINGS_SERVICE = "https://zndjfudjbjesrnmvedn2rvpoaa.appsync-api.eu-central-1.amazonaws.com/graphql";
const REGION = "eu-central-1"
const API_KEY = "da2-xy5anpjp35b67bwhlms4ym665m"

var current_url = document.URL;
console.log(current_url.replace("operator", "index"));

async function fetchMeetings() {
    const query = `query MyQuery {
        allMeetings(from_time: "2024", to_time:"2025") {
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
            "x-api-key": API_KEY
        },
        body: JSON.stringify({ query })

    });

    const responseBody = await response.json();
    // console.log(responseBody);

    const tableBody = document.querySelector('#itemsTable tbody');

    responseBody.data.allMeetings.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${item.id}</td>`;
        row.innerHTML += `<td>${item.started_by}</td>`;
        row.innerHTML += `<td>${item.fleet_operator}</td>`;
        row.innerHTML += `<td>${item.start_time}</td>`;

        if (item.end_time != null) {
            row.innerHTML += `<td>${item.end_time}</td>`;
        }
        else {
            row.innerHTML += `<td></td>`;
        }

        if (item.answered_by != null) {
            row.innerHTML += `<td>${item.answered_by}</td>`;
            row.innerHTML += `<td>${item.answer_time}</td>`;
            row.innerHTML += `<td></td>`;
        }
        else {
            row.innerHTML += `<td></td>`;
            row.innerHTML += `<td></td>`;
            if (item.end_time != null) {
                row.innerHTML += `<td></td>`;
            }
            else {
                row.innerHTML += `<td><a target="_blank" href="${current_url.replace("operator", "index")}?meetingId=${item.id}">Join</a></td>`;
            }
        }
        tableBody.appendChild(row);
    });
}

// Function to create a WebSocket connection and handle the subscription
async function startSubscription() {
    const wss_url = MEETINGS_SERVICE.replace('https', 'wss').replace('appsync-api', 'appsync-realtime-api');
    const host = MEETINGS_SERVICE.replace('https://', '').replace('/graphql', '');

    const api_header = { 'host': host, 'x-api-key': API_KEY };

    const subscriptionQuery = `subscription MySubscription {
        onCreateMeeting {
          answered_by
          answer_time
          end_time
          fleet_operator
          id
          start_time
          started_by
        }
      }`;

    const payload = {};

    const base64_api_header = btoa(JSON.stringify(api_header));
    const base64_payload = btoa(JSON.stringify(payload));

    // Create a new WebSocket connection
    const ws = new WebSocket(wss_url + "?payload=" + base64_payload + "&header=" + base64_api_header, ['graphql-ws']);

    // Event handler for when the WebSocket connection is opened
    ws.onopen = () => {
        console.log('WebSocket connection opened.');

        // Send the connection init message with the API key
        ws.send(JSON.stringify({
            type: 'connection_init',
        }));
    };

    // Event handler for when a message is received from the WebSocket server
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Message received:', message);

        // Handle different message types
        if (message.type === 'connection_ack') {
            console.log('Connection acknowledged by server.');

            // Send the subscription query once the connection is acknowledged
            const startMessage = JSON.stringify({
                type: 'start',
                id: '1',
                payload: {
                    data: JSON.stringify({
                        "query": subscriptionQuery,
                        "variables": {}
                    }),
                    extensions: {
                        authorization: api_header
                    }
                }
            });
            console.log('Sending start message');
            ws.send(startMessage);

        } else if (message.type === 'data' && message.id === '1') {
            const newMessage = message.payload.data.MySubscription;
            console.log('New message received:', newMessage);
        }
    };

    ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
    };

    // Event handler for when an error occurs with the WebSocket connection
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

window.addEventListener("DOMContentLoaded", () => {
    fetchMeetings();
    startSubscription()
});