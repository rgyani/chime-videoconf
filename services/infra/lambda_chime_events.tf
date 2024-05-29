resource "aws_iam_role" "role_lambda_chime_event" {
  name = "meetings_lambda_chime_events-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }

    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
  ]

  inline_policy {
    name = "lambda_read_table_and_api"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action   = "dynamodb:GetItem"
          Effect   = "Allow"
          Resource = [aws_dynamodb_table.tbl_meetings.arn]
        },
        {
          Action   = "appsync:GraphQL"
          Effect   = "Allow"
          Resource = ["${aws_appsync_graphql_api.appsync_meetings.arn}/types/Mutation/*"]
        }
      ]
    })
  }
}

# CANNOT create python lambda layer from a windows machine
# when implementing github actions we can uncomment this
# resource "null_resource" "install_layer_dependencies" {
#   provisioner "local-exec" {
#     command = "rm -rf /tmp/python && pip install -r ./requirements.txt -t /tmp/python"
#   }
#   triggers = {
#     # trigger = timestamp()  # everytime
#     requirements = filesha1("requirements.txt")  # if requirements.txt changes
#   }
# }

# data "archive_file" "layer_zip" {
#   type        = "zip"
#   source_dir  = "/tmp/python"
#   output_path = "layer.zip"
#   depends_on = [
#     null_resource.install_layer_dependencies
#   ]
# }

# resource "aws_lambda_layer_version" "layer_requests" {
#   filename            = data.archive_file.layer_zip.output_path
#   layer_name          = "requests-python311"
#   compatible_runtimes = ["python3.11"]
# }

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "./../lambda/lambda_chime_events.py"
  output_path = "/tmp/lambda.zip"
}


resource "aws_lambda_function" "lambda_chime_events" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "meetings_lambda_chime_events"
  role             = aws_iam_role.role_lambda_chime_event.arn
  handler          = "lambda_chime_events.lambda_handler" # Update to your handler function
  runtime          = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout = 15

  # layers           = [aws_lambda_layer_version.layer_requests.arn]
  layers           = ["arn:aws:lambda:eu-central-1:770693421928:layer:Klayers-p312-requests:4"]

  environment {
    variables = {
      "TABLE_NAME" : aws_dynamodb_table.tbl_meetings.name,
      "APPSYNC_API_ENDPOINT_URL" : aws_appsync_graphql_api.appsync_meetings.uris["GRAPHQL"]
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda_chime_events_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.lambda_chime_events.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_event_rule" "chime_meeting_state_change_rule" {
  name        = "chime_meeting_state_change_rule"
  description = "Event rule for Chime Meeting State Change"
  event_pattern = jsonencode({
    "source": ["aws.chime"],
    "detail-type": ["Chime Meeting State Change"],
    "detail": {
      "eventType": ["chime:AttendeeJoined", "chime:AttendeeLeft", "chime:MeetingEnded"]
    }
  })
}

resource "aws_cloudwatch_event_target" "invoke_lambda" {
  rule      = aws_cloudwatch_event_rule.chime_meeting_state_change_rule.name
  target_id = "chime_meeting_state_change_lambda"
  arn       = aws_lambda_function.lambda_chime_events.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_chime_events.arn

  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.chime_meeting_state_change_rule.arn
}