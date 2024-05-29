resource "aws_appsync_graphql_api" "appsync_meetings" {
  authentication_type = "API_KEY"
  name                = "meetings_graphql_api"

  additional_authentication_provider {
    authentication_type = "AWS_IAM"
  }

  schema = file("schema/schema.graphql")
}


resource "aws_appsync_api_key" "meetings_graphql_key" {
  api_id  = aws_appsync_graphql_api.appsync_meetings.id
  expires = "2024-12-30T00:00:00Z"
}


resource "aws_iam_policy" "policy_appsync_dynamodb_read" {
  name        = "AppSyncDynamoDBReadPolicy"
  description = "Policy to allow AppSync to read from the DynamoDB table"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ],
        Resource = aws_dynamodb_table.tbl_meetings.arn
      }
    ]
  })
}

resource "aws_iam_role" "role_appsync_meetings" {
  name = "role_meeting_appsync_dynamodb"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "appsync.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attachment_app_sync_role_policy" {
  role       = aws_iam_role.role_appsync_meetings.name
  policy_arn = aws_iam_policy.policy_appsync_dynamodb_read.arn
}

# Create data source in appsync from dynamodb tble
resource "aws_appsync_datasource" "meetings_datasource" {
  name             = "meetings_datasource"
  api_id           = aws_appsync_graphql_api.appsync_meetings.id
  service_role_arn = aws_iam_role.role_appsync_meetings.arn
  type             = "AMAZON_DYNAMODB"
  dynamodb_config {
    table_name = aws_dynamodb_table.tbl_meetings.name
  }
}


# createMeeting mutation.
resource "aws_appsync_resolver" "create_meeting_resolver" {
  api_id      = aws_appsync_graphql_api.appsync_meetings.id
  type        = "Mutation"
  field       = "createMeeting"
  data_source = aws_appsync_datasource.meetings_datasource.name

  request_template  = file("./schema/resolvers/create_meeting.vtl")
  response_template = file("./schema/resolvers/response.vtl")
}

# joinMeeting mutation
resource "aws_appsync_resolver" "join_meeting_resolver" {
  api_id      = aws_appsync_graphql_api.appsync_meetings.id
  type        = "Mutation"
  field       = "joinMeeting"
  data_source = aws_appsync_datasource.meetings_datasource.name

  request_template  = file("./schema/resolvers/join_meeting.vtl")
  response_template = file("./schema/resolvers/response.vtl")
}

# endMeeting mutation
resource "aws_appsync_resolver" "end_meeting_resolver" {
  api_id      = aws_appsync_graphql_api.appsync_meetings.id
  type        = "Mutation"
  field       = "endMeeting"
  data_source = aws_appsync_datasource.meetings_datasource.name

  request_template  = file("./schema/resolvers/end_meeting.vtl")
  response_template = file("./schema/resolvers/response.vtl")
}


# getMeeting query
resource "aws_appsync_resolver" "get_meeting_resolver" {
  api_id      = aws_appsync_graphql_api.appsync_meetings.id
  type        = "Query"
  field       = "getMeeting"
  data_source = aws_appsync_datasource.meetings_datasource.name

  request_template  = file("./schema/resolvers/end_meeting.vtl")
  response_template = file("./schema/resolvers/response.vtl")
}

# allMeetings query
resource "aws_appsync_resolver" "all_meetings_resolver" {
  api_id      = aws_appsync_graphql_api.appsync_meetings.id
  type        = "Query"
  field       = "allMeetings"
  data_source = aws_appsync_datasource.meetings_datasource.name

  request_template  = file("./schema/resolvers/all_meetings.vtl")
  response_template = file("./schema/resolvers/response.vtl")
}

# operatorMeetings query
resource "aws_appsync_resolver" "operator_meetings_resolver" {
  api_id      = aws_appsync_graphql_api.appsync_meetings.id
  type        = "Query"
  field       = "operatorMeetings"
  data_source = aws_appsync_datasource.meetings_datasource.name

  request_template  = file("./schema/resolvers/operator_meetings.vtl")
  response_template = file("./schema/resolvers/response.vtl")
}

# unansweredMeetings query
resource "aws_appsync_resolver" "unanswered_meetings_resolver" {
  api_id      = aws_appsync_graphql_api.appsync_meetings.id
  type        = "Query"
  field       = "unansweredMeetings"
  data_source = aws_appsync_datasource.meetings_datasource.name

  request_template  = file("./schema/resolvers/unanswered_meetings.vtl")
  response_template = file("./schema/resolvers/response.vtl")
}
