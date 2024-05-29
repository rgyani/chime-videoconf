
meeting_id = "m1"
event_time = "t1"

mutation = """mutation MyMutation {
    endMeeting(input: {id: "%s", end_time: "%s"}) {
        answer_time
        answered_by
        end_time
        fleet_operator
        id
        start_time
        started_by
    }
}""".format(meeting_id, event_time)

print(mutation)