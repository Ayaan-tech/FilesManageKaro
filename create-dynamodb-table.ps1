# PowerShell script to create DynamoDB table
$tableName = "DocumentMetadata"
$region = "ap-south-1"

Write-Host "Creating DynamoDB table: $tableName in region: $region"

# Create the table
aws dynamodb create-table `
  --table-name $tableName `
  --attribute-definitions `
    AttributeName=FileID,AttributeType=S `
    AttributeName=UserId,AttributeType=S `
    AttributeName=UploadTimestamp,AttributeType=S `
  --key-schema `
    AttributeName=FileID,KeyType=HASH `
  --global-secondary-indexes `
    'IndexName=UserIdIndex,KeySchema=[{AttributeName=UserId,KeyType=HASH},{AttributeName=UploadTimestamp,KeyType=RANGE}],Projection={ProjectionType=ALL}' `
  --billing-mode PAY_PER_REQUEST `
  --region $region

if ($LASTEXITCODE -eq 0) {
    Write-Host "Table created successfully!"
    Write-Host "Waiting for table to become active..."
    
    # Wait for table to become active
    aws dynamodb wait table-exists --table-name $tableName --region $region
    
    Write-Host "Table is now active and ready to use!"
} else {
    Write-Host "Failed to create table. Error code: $LASTEXITCODE"
}