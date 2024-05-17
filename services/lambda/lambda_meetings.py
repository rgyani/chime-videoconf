import os
import decimal
import json
import logging
import time
import urllib.parse
from random import randint
import boto3
from botocore.exceptions import ClientError
import uuid

client = boto3.client('chime-sdk-meetings')

rest_response = {
    'statusCode': 200,
    'headers': {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Content-Type': 'application/json'
    }
}


def lambda_handler(event, context):
    print(event)
    if event["action"] == "NEW_MEETING":
        return new_meeting(event)
    if event["action"] == "JOIN_MEETING":
        return join_meeting(event)
    elif event["action"] == "DELETE_ATTENDEE":
        return delete_attendee(event)
    elif event["action"] == "END_MEETING":
        return delete_meeting(event)


def new_meeting(event):
    userName = event["USERNAME"]

    meeting_token = str(uuid.uuid4())
    print("creating new meeting")

    meeting_info = client.create_meeting(
        ClientRequestToken=meeting_token,
        MediaRegion='eu-central-1',
        ExternalMeetingId=meeting_token,
    )

    print(meeting_info)
    attendee_info = client.create_attendee(
        MeetingId=meeting_info["Meeting"]["MeetingId"],
        ExternalUserId=userName,
        Capabilities={
            "Audio": "SendReceive",
            "Video": "SendReceive",
            "Content": "SendReceive"
        }
    )
    print(attendee_info)

    rest_response["body"] = json.dumps({"Info": {
        "Meeting": meeting_info["Meeting"],
        "Attendee": attendee_info["Attendee"]
    }})

    print(rest_response)
    return rest_response


def join_meeting(event):
    meetingId = event["MEETING_ID"]
    userName = event["USERNAME"]

    meeting_info = client.get_meeting(
        MeetingId=meetingId
    )

    print(meeting_info)
    attendee_info = client.create_attendee(
        MeetingId=meeting_info["Meeting"]["MeetingId"],
        ExternalUserId=userName,
        Capabilities={
            "Audio": "SendReceive",
            "Video": "SendReceive",
            "Content": "SendReceive"
        }
    )
    print(attendee_info)

    rest_response["body"] = json.dumps({"Info": {
        "Meeting": meeting_info["Meeting"],
        "Attendee": attendee_info["Attendee"]
    }})

    print(rest_response)
    return rest_response


def delete_attendee(event):
    meeting_id = event["MEETING_ID"]
    attendee_id = event["ATTENDEE_ID"]
    meeting_info = client.delete_attendee(
        MeetingId=meeting_id,
        AttendeeId=attendee_id
    )
    return rest_response


def delete_meeting(event):
    meeting_id = event["MEETING_ID"]
    meeting_info = client.delete_meeting(
        MeetingId=meeting_id,
    )
    return rest_response
