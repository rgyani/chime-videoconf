import os
import decimal
import json
import logging
import time
import urllib.parse
from random import randint
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
import uuid
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import get_credentials
from botocore.session import get_session
import requests

dynamodb_client = boto3.client("dynamodb")
# TABLE_NAME = "ravi-test-chime"  # os.environ["TABLE_NAME"]
# APPSYNC_API_ENDPOINT_URL = 'https://zndjfudjbjesrnmvedn2rvpoaa.appsync-api.eu-central-1.amazonaws.com/graphql'

TABLE_NAME = os.environ["TABLE_NAME"]
APPSYNC_API_ENDPOINT_URL = os.environ["APPSYNC_API_ENDPOINT_URL"]

def lambda_handler(event, context):
    print(event)
    if event["detail"]["eventType"] == "chime:AttendeeJoined":
        add_attendee(event)
    if event["detail"]["eventType"] == "chime:MeetingEnded":
        meeting_ended(event)

def add_attendee(event):
    meeting_id = event["detail"]["meetingId"]
    event_time = event["time"]
    user_id = event["detail"]["externalUserId"]

    # fetch this from external database, based on user_id (VIN)
    fleet_operator = "UBER"

    print("meeting_id", meeting_id)
    print("event_time", event_time)
    print("user_id", user_id)

    # we first check if the meeting already exists
    response = dynamodb_client.get_item(
        TableName=TABLE_NAME,
        Key={
            "id": {"S": meeting_id},
        },
        AttributesToGet=[ 'id'],
    )
    
    mutation = ""
    # if new item, then it is a new meeting being started
    # else the meeting has been answered by the operator
    if "Item" in response:
        print("Join existing meeting")
        # dynamodb_client.update_item(
        #     TableName=TABLE_NAME,
        #     Key={
        #         'id': {'S': meeting_id},
        #     },
        #     UpdateExpression='SET answer_time = :answer_time, answered_by = :answered_by',
        #     ExpressionAttributeValues={
        #         ':answer_time': {'S': event_time},
        #         ':answered_by': {'S': user_id},
        #     })
        mutation = """mutation MyMutation {
                joinMeeting(input: {id: "MEETING_ID", answer_time: "ANSWER_TIME", answered_by: "ANSWERED_BY"}) {
                    answer_time
                    answered_by
                    end_time
                    fleet_operator
                    id
                    start_time
                    started_by
                }
        }
        """.replace("MEETING_ID", meeting_id).replace("ANSWER_TIME", event_time).replace("ANSWERED_BY", user_id)
    else:
        print("New meeting")
        # dynamodb_client.put_item(
        #     TableName=TABLE_NAME,
        #     Item={
        #         "id": {"S": meeting_id},
        #         "fleet_operator": {"S": fleet_operator},
        #         "start_time": {"S": event_time},
        #         "started_by": {"S": user_id}
        #     }
        # )
        mutation = """mutation MyMutation {
                createMeeting(input: {id: "MEETING_ID", fleet_operator: "FLEET_OPERATOR", start_time: "START_TIME", started_by: "STARTED_BY"}) {
                    answer_time
                    answered_by
                    end_time
                    fleet_operator
                    id
                    start_time
                    started_by
                }
        }
        """.replace("MEETING_ID", meeting_id).replace("FLEET_OPERATOR", fleet_operator).replace("START_TIME", event_time).replace("STARTED_BY", user_id)

   # Get AWS credentials
    session = get_session()
    credentials = get_credentials(session).get_frozen_credentials()
    # Create AWS request
    request = AWSRequest(method="POST", url=APPSYNC_API_ENDPOINT_URL, data=json.dumps({"query": mutation}))
    SigV4Auth(credentials, "appsync", session.get_config_variable("region")).add_auth(request)

     # Convert the request to a format compatible with requests library
    prepared_request = requests.Request(
        method=request.method,
        url=request.url,
        headers=dict(request.headers.items()),
        data=request.body
    ).prepare()

    # Make the HTTP POST request
    response = requests.Session().send(prepared_request)

    # Parse and return the response
    response_data = response.json()
    print(response_data)

def meeting_ended(event):
    meeting_id = event["detail"]["meetingId"]
    event_time = event["time"]

    print("meeting_id", meeting_id)
    print("event_time", event_time)

    print("End existing meeting")
    # we first check if the meeting already exists
    response = dynamodb_client.get_item(
        TableName=TABLE_NAME,
        Key={
            "id": {"S": meeting_id},
        },
        AttributesToGet=[ 'id'],

    )

    # if meeting not found, this has already been removed from DB
    if "Item" not in response:
        return
    
    mutation = """mutation MyMutation {
        endMeeting(input: {id: "MEETING_ID", end_time: "END_TIME"}) {
            answer_time
            answered_by
            end_time
            fleet_operator
            id
            start_time
            started_by
        }
    }""".replace("MEETING_ID", meeting_id).replace("END_TIME", event_time)
    

      # Get AWS credentials
    session = get_session()
    credentials = get_credentials(session).get_frozen_credentials()
    # Create AWS request
    request = AWSRequest(method="POST", url=APPSYNC_API_ENDPOINT_URL, data=json.dumps({"query": mutation}))
    SigV4Auth(credentials, "appsync", session.get_config_variable("region")).add_auth(request)

     # Convert the request to a format compatible with requests library
    prepared_request = requests.Request(
        method=request.method,
        url=request.url,
        headers=dict(request.headers.items()),
        data=request.body
    ).prepare()

    # Make the HTTP POST request
    response = requests.Session().send(prepared_request)

    # Parse and return the response
    response_data = response.json()
    print(response_data)