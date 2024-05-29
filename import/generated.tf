# __generated__ by Terraform
# Please review these resources and move them into your main configuration files.

# __generated__ by Terraform from "appsync-ds-ddb-zhNxF3CHMCGP-todo"
resource "aws_iam_role" "example" {
  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "appsync.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
  description           = null
  force_detach_policies = false
  managed_policy_arns   = ["arn:aws:iam::035920457974:policy/service-role/appsync-ds-ddb-zhNxF3CHMCGP-todo"]
  max_session_duration  = 3600
  name                  = "appsync-ds-ddb-zhNxF3CHMCGP-todo"
  name_prefix           = null
  path                  = "/service-role/"
  permissions_boundary  = null
  tags                  = {}
  tags_all              = {}
}
