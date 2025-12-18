const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  }
});

const tableName = 'DocumentMetadata';

async function createTable() {
  try {
    console.log(`Creating DynamoDB table: ${tableName}`);
    
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const existingTable = await client.send(describeCommand);
      console.log(`Table ${tableName} already exists with status: ${existingTable.Table.TableStatus}`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Table doesn't exist, continue with creation
    }
    
    const createCommand = new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        {
          AttributeName: 'FileID',
          AttributeType: 'S'
        },
        {
          AttributeName: 'UserId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'UploadTimestamp',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'FileID',
          KeyType: 'HASH'
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            {
              AttributeName: 'UserId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'UploadTimestamp',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ],
      BillingMode: 'PAY_PER_REQUEST',
      Tags: [
        {
          Key: 'Project',
          Value: 'TextractProcessor'
        },
        {
          Key: 'Environment',
          Value: 'Development'
        }
      ]
    });

    const result = await client.send(createCommand);
    console.log('Table created successfully!');
    console.log('Table ARN:', result.TableDescription.TableArn);
    console.log('Table Status:', result.TableDescription.TableStatus);
    
    // Wait for table to become active
    console.log('Waiting for table to become active...');
    let tableStatus = 'CREATING';
    while (tableStatus !== 'ACTIVE') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const description = await client.send(describeCommand);
      tableStatus = description.Table.TableStatus;
      console.log(`Table status: ${tableStatus}`);
    }
    
    console.log('✅ Table is now active and ready to use!');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTable();