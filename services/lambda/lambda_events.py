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

dynamodb_client = boto3.client("dynamodb")
table_name = "ravi-test-chime"  # os.environ["TABLE_NAME"]


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
        TableName=table_name,
        Key={
            "id": {"S": meeting_id},
        }
    )

    # if new item, then it is a new meeting being started
    # else the meeting has been answered by the operator
    if "Item" in response:
        print("Join existing meeting")
        dynamodb_client.update_item(
            TableName=table_name,
            Key={
                'id': {'S': meeting_id},
            },
            UpdateExpression='SET answer_time = :answer_time, answered_by = :answered_by',
            ExpressionAttributeValues={
                ':answer_time': {'S': event_time},
                ':answered_by': {'S': user_id},
            })
    else:
        print("New meeting")
        dynamodb_client.put_item(
            TableName=table_name,
            Item={
                "id": {"S": meeting_id},
                "fleet_operator": {"S": fleet_operator},
                "start_time": {"S": event_time},
                "started_by": {"S": user_id}
            }
        )


def meeting_ended(event):
    meeting_id = event["detail"]["meetingId"]
    event_time = event["time"]

    print("meeting_id", meeting_id)
    print("event_time", event_time)

    print("End existing meeting")
    # we first check if the meeting already exists
    response = dynamodb_client.get_item(
        TableName=table_name,
        Key={
            "id": {"S": meeting_id},
        }
    )

    # if new item, then it is a new meeting being started
    # else the meeting has been answered by the operator
    if "Item" in response:
        dynamodb_client.update_item(
            TableName=table_name,
            Key={
                'id': {'S': meeting_id},
            },
            UpdateExpression='SET end_time = :end_time',
            ExpressionAttributeValues={
                ':end_time': {'S': event_time},
            }
        )



## just for testing from local

def insert():
    meeting_id = "m1"
    start_user = "u1"
    attendee_user = "u2"
    new_meeting = {'version': '0', 'id': 'cd527901-b650-f4d3-3061-8c846562811a',
                   'detail-type': 'Chime Meeting State Change',
                   'source': 'aws.chime', 'account': '035920457974', 'time': '2024-05-21T09:04:40Z',
                   'region': 'eu-central-1',
                   'resources': [],
                   'detail': {'version': '0', 'eventType': 'chime:AttendeeAdded', 'timestamp': 1716282280705.0,
                              'meetingId': meeting_id,
                              'attendeeId': '3aa1c8bc-738a-f692-d59e-e84a546929d2', 'externalUserId': start_user,
                              'externalMeetingId': 'b690c617-1caa-4a07-b99d-5d257de65d9e',
                              'mediaRegion': 'eu-central-1'}}
    lambda_handler(new_meeting, None)

    join_meeting = {'version': '0', 'id': '39543e02-e5f5-d658-4cde-f46ca5bff501',
                    'detail-type': 'Chime Meeting State Change',
                    'source': 'aws.chime', 'account': '035920457974', 'time': '2024-05-21T09:23:43Z',
                    'region': 'eu-central-1',
                    'resources': [],
                    'detail': {'version': '0', 'eventType': 'chime:AttendeeAdded', 'timestamp': 1716283423523.0,
                               'meetingId': meeting_id,
                               'attendeeId': '91ce4675-b21f-54ae-2097-418bf82faa37', 'externalUserId': attendee_user,
                               'externalMeetingId': 'da5d81f5-84a4-4d99-9ea2-caa1d11e0657',
                               'mediaRegion': 'eu-central-1'}}

    lambda_handler(join_meeting, None)


def query():
    # {
    #     "version": "2018-05-29",
    #     "operation": "Query",
    #     "index": "fleet_operator-start_time-index",
    #     "query": {
    #         "expression": "#fleet_operator = :fleet_operator AND #start_time BETWEEN :from_time AND :to_time",
    #         "expressionNames": {
    #             "#fleet_operator": "fleet_operator",
    #             "#start_time": "start_time"
    #         },
    #         "expressionValues": {
    #             ":fleet_operator": {"S": "${ctx.args.input.fleet_operator}"},
    #             ":from_time": {"S": "${ctx.args.input.from_time}"},
    #             ":to_time": {"S": "${ctx.args.input.to_time}"}
    #         }
    #     },
    #     "limit": $util.toJson($util.defaultIfNull(${ctx.args.limit}, 20)),
    #     "nextToken": $util.toJson($util.defaultIfNullOrBlank($ctx.args.nextToken, null))
    # }

    response = dynamodb_client.query(
        TableName=table_name,
        IndexName="fleet_operator-start_time-index",
        KeyConditionExpression='fleet_operator = :operator AND start_time BETWEEN :from_time AND :to_time',
        ExpressionAttributeValues={
            ':operator': {'S': 'UBER'},
            ':from_time': {'S': '2024'},
            ':to_time': {'S': '2025'}
        }
    )
    print(response)

    dynamodb_resource = boto3.resource('dynamodb', region_name="eu-central-1")
    table = dynamodb_resource.Table(table_name)
    response = table.query(
        IndexName="fleet_operator-start_time-index",
        KeyConditionExpression=Key('fleet_operator').eq('UBER') & Key('start_time').between('2024', '2025')
    )
    print(response)


if __name__ == "__main__":
    query()
