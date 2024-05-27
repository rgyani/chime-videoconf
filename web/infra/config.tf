terraform {
  required_providers {
    aws = {
      version = "~> 5.50.0"
    }
  }

  required_version = "~> 1.8.3"
}

provider "aws" {
  region = "eu-central-1"

  default_tags {
    tags = {
      Environment = "dev"
      Service     = "admt-cloud-frontend"
      Project     = "admt-cloud"
    }
  }
}
