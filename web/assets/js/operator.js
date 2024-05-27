const MEETINGS_WS_SERVICE = "https://zndjfudjbjesrnmvedn2rvpoaa.appsync-api.eu-central-1.amazonaws.com/graphql";
const REGION = "eu-central-1"
const API_KEY = "da2-xy5anpjp35b67bwhlms4ym665m"

const MEETING_APIGW_SERVICE = "https://hhs9rhcuo8.execute-api.eu-central-1.amazonaws.com/prod/meeting";

meetingId = null

// Generate a unique client Id for the user
clientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const attendees = new Set();

let requestPath = MEETING_APIGW_SERVICE + `?clientId=${clientId}`;


var startButton = document.getElementById("start-button");
var exitButton = document.getElementById("exit-button");

// Setup logger
const logger = new window.ChimeSDK.ConsoleLogger(
	"ChimeMeetingLogs",
	ChimeSDK.LogLevel.INFO
);

const deviceController = new ChimeSDK.DefaultDeviceController(logger);


async function fetchUnAnsweredMeetings() {
    const query = `query MyQuery {
        unansweredMeeting(fleet_operator: "UBER") {
          items {
            id
          }
        }
      }`;

    var response = await fetch(MEETINGS_WS_SERVICE, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            "x-api-key": API_KEY
        },
        body: JSON.stringify({ query })

    });

    const responseBody = await response.json();
    console.log(responseBody); 

    meetingId = responseBody.data.unansweredMeeting.items[0].id
    document.getElementById("meeting-Id").innerText = meetingId;

}

// Create or Join Meeting
async function doMeeting() {
    if (meetingId == null){
        alert("No meetings available");
		return;
    }

	userName = document.getElementById("username").value;
    if (meetingId.length <= 1) {
		alert("Please enter username");
		return;
	}


	if (userName.length <= 1) {
		alert("Please enter username");
		return;
	}

	if (userName.indexOf("#") >= 0) {
		alert("Please do not use special characters in User Name");
		return;
	}

	//If Meeting session already present, return.
	if (window.meetingSession) {
		//alert("Meeting already in progress");
		return;
	}
	try {
		//Send request to service(API Gateway > Lambda function) to start/join meeting.
		var response = await fetch(requestPath, {
			method: "POST",
			headers: new Headers(),
			body: JSON.stringify({ 
				action: "JOIN_MEETING", 
				MEETING_ID: `${meetingId}`, USERNAME: `${userName}` })
		});

		let data = await response.json();
		data = JSON.parse(data.body)
		console.log(data)
		
		if (! data.hasOwnProperty('Info')) {
			alert("Oops! The meeting might have ended!");
			console.log("Meeting was not Found");	
			return;
		}

		meetingId = data.Info.Meeting.MeetingId;
		attendeeId = data.Info.Attendee.AttendeeId;
		console.log(attendeeId)

		document.getElementById("meeting-Id").innerText = meetingId;
		const configuration = new ChimeSDK.MeetingSessionConfiguration(
			data.Info.Meeting,
			data.Info.Attendee
		);
		window.meetingSession = new ChimeSDK.DefaultMeetingSession(
			configuration,
			logger,
			deviceController
		);

		// Initialize Audio Video
		const audioInputs = await meetingSession.audioVideo.listAudioInputDevices();
		const videoInputs = await meetingSession.audioVideo.listVideoInputDevices();

		await meetingSession.audioVideo.startAudioInput(audioInputs[0].deviceId);
		await meetingSession.audioVideo.startVideoInput(videoInputs[0].deviceId);

		const observer = {
			// Tile State changed, so let's examine it.
			videoTileDidUpdate: (tileState) => {
				// if no attendeeId bound to tile, ignore it return
				if (!tileState.boundAttendeeId) {
					return;
				}
				//There is an attendee Id against the tile, and it's a valid meeting session, then update tiles view
				if (!(meetingSession === null)) {
					updateTiles(meetingSession);
				}
			},
		};

		const eventObserver = {
			// Check for events of interest for eg. Meeting End.
			eventDidReceive(name, attributes) {
				switch (name) {
					case 'meetingEnded':
					  cleanup();
					  console.log("NOTE: Meeting Ended", attributes);
					  break;
					case 'meetingReconnected':
					  console.log('NOTE: Meeting Reconnected...');
					  break;
			}
		  }
		}

		// Add observers for the meeting session
		meetingSession.audioVideo.addObserver(observer);
		meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(attendeeObserver);
		meetingSession.eventController.addObserver(eventObserver);

		const audioOutputElement = document.getElementById("meeting-audio");
		meetingSession.audioVideo.bindAudioElement(audioOutputElement);
		meetingSession.audioVideo.start();
		meetingSession.audioVideo.startLocalVideoTile();
	}
	catch (err) {
		console.error("Error: " + err);
	}
}

// Update Video Tiles on UI view
function updateTiles(meetingSession) {
	const tiles = meetingSession.audioVideo.getAllVideoTiles();
	tiles.forEach(tile => {
		let tileId = tile.tileState.tileId
		var divElement = document.getElementById("div-" + tileId);
		// If divElement not found.
		if (!divElement) {
			// Create divElement. Give it a unique id and name
			divElement = document.createElement("div");
			divElement.id = "div-" + + tileId;
			divElement.setAttribute("name", "div-" + tile.tileState.boundAttendeeId);
			divElement.style.display = "inline-block";
			divElement.style.padding = "5px";

			// Create videoElement. Give it a unique id
			videoElement = document.createElement("video");
			videoElement.id = "video-" + tileId;
			videoElement.setAttribute("name", "video-" + tile.tileState.boundAttendeeId);
			videoElement.controls = true;

			// Create 'p' element for user name to display above video tile.
			tileUserName = document.createElement("p");
			tileUserName.style.color="blueviolet";
			boundExtUserId = tile.tileState.boundExternalUserId
			tileUserName.textContent = boundExtUserId.substring(0, boundExtUserId.indexOf("#"));

			// Append appropriately
			divElement.append(tileUserName);
			divElement.append(videoElement);
			document.getElementById("video-list").append(divElement);

			meetingSession.audioVideo.bindVideoElement(
				tileId,
				videoElement
			);
		}
	})
}

// Attendee presence check
// Update the attendees set and div video tiles display based on this.
function attendeeObserver(attendeeId, present, externalUserId, dropped, posInFrame) {

	//Get Attendee User Name from externalUserId where it was set while joining meeting
	attendeeUserName = externalUserId.substring(0, externalUserId.indexOf("#"));

	// If attendee 'present' is true, add to attendees set.
	if (present) {
		attendees.add(attendeeUserName);
	}
	else {
		// Attendee no longer 'present', remove the attendee display div with video tile
		const elements = document.getElementsByName("div-" + attendeeId);
		elements[0].remove();

		// For screen share attendeeId comes with #content suffix.
		// Do not remove user from attendees if this is screen share closure update
		if (!(attendeeId.indexOf("#content") >= 0)) {
			attendees.delete(attendeeUserName);
		}
	}

	refreshAttendeesDisplay();
};

// Refresh attendee list in UI view
function refreshAttendeesDisplay()
{
	//Create list of attendees from attendees set, and then display.
	attendeeStr = "";
	for (const item of attendees) {
		attendeeStr = attendeeStr + item + " | ";
	}
	attendeeStr = attendeeStr.slice(0, -3);

	document.getElementById("Attendees").innerText = attendeeStr;
}

// Stop Meeting		
async function stopMeeting() {
	//Send request to service(API Gateway > Lambda function) to end the Meeting
	try {
		var response = await fetch(requestPath, {
			method: "POST",
			headers: new Headers(),
			body: JSON.stringify({ action: "END_MEETING", MEETING_ID: `${meetingId}` })
		});

		const data = await response.json();
		console.log("NOTE: END MEETING RESPONSE " + JSON.stringify(data));
		//meetingSession.deviceController.destroy();

		cleanup();
	}
	catch (err) {
		console.error("NOTE Error: " + err);
	}
}

// Leave Meeting
async function exitMeeting() {
	//Send request to service(API Gateway > Lambda function) to delete Attendee Id from meeting.
	try {
		var response = await fetch(requestPath, {
			method: "POST",
			headers: new Headers(),
			body: JSON.stringify({ action: "DELETE_ATTENDEE", MEETING_ID: `${meetingId}`, ATTENDEE_ID: `${attendeeId}` })
		});

		const data = await response.json();
		console.log("NOTE: END MEETING RESPONSE " + JSON.stringify(data));
		//meetingSession.deviceController.destroy();

		cleanup();
	}
	catch (err) {
		console.error("Error: " + err);
	}
}

// Reset 
function cleanup()
{
	meetingSession.deviceController.destroy();
	window.meetingSession = null;
	//if meeting host - don't preserve the meeting id.
	if (isMeetingHost)
	{
		meetingId = null;
	}
	document.getElementById("video-list").replaceChildren();
	attendees.clear();
	document.getElementById("meeting-link").innerText = "";
	refreshAttendeesDisplay();
}

window.addEventListener("DOMContentLoaded", () => {
    fetchUnAnsweredMeetings();

    startButton.addEventListener("click", doMeeting);
    exitButton.addEventListener("click", exitMeeting);

});