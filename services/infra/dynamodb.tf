resource "aws_dynamodb_table" "tbl_meetings" {
  name         = "meetings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "start_time"
    type = "S"
  }
  attribute {
    name = "fleet_operator"
    type = "S"
  }
  attribute {
    name = "C"
    type = "S"
  }

  global_secondary_index {
    name            = "C-start_time-index"
    hash_key        = "C"
    range_key       = "start_time"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "fleet_operator-start_time-index"
    hash_key        = "fleet_operator"
    range_key       = "start_time"
    projection_type = "ALL"
  }
}
