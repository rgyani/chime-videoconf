# GraphQL API
output "appsync_graphql_api_id" {
  description = "ID of GraphQL API"
  value       = aws_appsync_graphql_api.appsync_meetings.id
}

output "appsync_graphql_api_arn" {
  description = "ARN of GraphQL API"
  value       = aws_appsync_graphql_api.appsync_meetings.arn
}

output "appsync_graphql_api_uris" {
  description = "Map of URIs associated with the API"
  value       = aws_appsync_graphql_api.appsync_meetings.uris
}

output "appsync_graphql_api_key" {
  description = "Key to be used with the GraphQL API"
  value       = aws_appsync_api_key.meetings_graphql_key.key
  sensitive = true
}
