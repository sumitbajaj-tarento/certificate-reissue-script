# User Certificate Regeneration Script

This Node.js script updates user profiles and regenerates certificates based on the provided user data. The script interacts with Cassandra for updating user data and an external API for reissuing certificates.

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v12.x or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Cassandra](https://cassandra.apache.org/) for database interactions

## Setup
### 1. Clone the repository
```bash
git clone <repository_url>
cd <repository_directory>
```
### 2. Install Node.js dependencies
```bash
npm install
```
### 3. Create a .env file
The .env file should include the following environment variables:
```bash
HOST=<your-host-url>
API_KEY=<your-api-key>
X_AUTHENTICATED_USER_TOKEN=<authenticated-user-token>
CASSANDRA_HOST=<cassandra-host>
CASSANDRA_KEYSPACE=<cassandra-keyspace>
USER_CERTIFICATE_REISSUE_ENDPOINT=<certificate-reissue-endpoint>
USER_PROFILE_READ_ENDPOINT=<profile-read-endpoint>
USER_PROFILE_UPDATE_ENDPOINT=<profile-update-endpoint>
```
### 4. Add user data
Create a userData.json file in the root directory with the following structure:
```json
[
  {
    "userId": "b2b4aa55-e26c-4899-9bb0-0216aceacd42",
    "actions": [
      "updateProfile",
      "reissueCertificate"
    ],
    "profileDetails": {
      "firstName": "John",
      "lastName": "Doe",
      "regNurseRegMidwifeNumber": "RN12345"
    },
    "courseDetails": [
      {
        "courseId": "do_1135953715273646081267",
        "batchId": "0136103495294812169"
      }
    ]
  }
]
```
### Running the Script
To start the Node.js server, run:
```bash
node index.js
```
This will start the server on port 3000. You can verify the server by visiting http://localhost:3000 or using a tool like Postman.
### How the Script Works
The script handles two main tasks:

- Profile Update: If "updateProfile" is specified in the actions array, the user's profile (first name, last name, and nurse/midwife registration number) will be updated.
- Certificate Reissue: If "reissueCertificate" is included, the script reissues a new certificate for the user's courses.
- Data Source: User data is read from the userData.json file, and the status of operations is logged in courseLogs.txt.

### Request Body Structure
Each user object in the userData.json file must contain:

- userId (string): The user's unique identifier.
- actions (array of strings): Actions to be performed. Possible values:
  - "updateProfile": Update the user's profile.
  - "reissueCertificate": Reissue the course certificate.
- profileDetails (object): Profile details for update:
  - firstName (string): User's first name.
  - lastName (string): User's last name.
  - regNurseRegMidwifeNumber (string): Nurse/midwife registration number.
- courseDetails (array of objects): Contains course info for certificate reissue:
  - courseId (string): Course ID.
  - batchId (string): Batch ID.
