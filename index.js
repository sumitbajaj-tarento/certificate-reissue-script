const express = require("express");
var axios = require("axios");
const app = express();
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();
app.get("/", async (req, res) => {
  try {
    const cassandra = require("cassandra-driver");
    const client = new cassandra.Client({
      contactPoints: [process.env.CASSANDRA_HOST],
      keyspace: process.env.CASSANDRA_KEYSPACE,
      localDataCenter: "datacenter1",
    });
    const host = process.env.HOST;
    const apiKey = process.env.API_KEY;
    const xAuthenticatedToken = process.env.X_AUTHENTICATED_USER_TOKEN;
    const apiEndpoints = {
      certificateReissue: `${host}/${process.env.USER_CERTIFICATE_REISSUE_ENDPOINT}`,
      userProfileRead: `${host}/${process.env.USER_PROFILE_READ_ENDPOINT}`,
      userProfileUpdate: `${host}/${process.env.USER_PROFILE_UPDATE_ENDPOINT}`,
    };
    const userProfileUpdater = async (
      userId,
      firstName,
      lastName,
      regNurseRegMidwifeNumber
    ) => {
      try {
        const userReadResponse = await axios({
          headers: {
            Authorization: apiKey,
            "x-authenticated-user-token": xAuthenticatedToken,
          },
          method: "GET",
          url: `${apiEndpoints.userProfileRead}/${userId}`,
        });
        let userProfileData = {
          request: {
            firstName: firstName,
            lastName: lastName,
            userId: userId,
            profileDetails:
              userReadResponse.data.result.response.profileDetails,
          },
        };
        userProfileData.request.profileDetails.profileReq.personalDetails.firstname = firstName;
        userProfileData.request.profileDetails.profileReq.personalDetails.surname =
          lastName;
        if (regNurseRegMidwifeNumber) {
          userProfileData.request.profileDetails.profileReq.personalDetails.regNurseRegMidwifeNumber =
            regNurseRegMidwifeNumber;
        }

        const userUpdateResponse = await axios({
          headers: {
            Authorization: apiKey,
          },
          method: "PATCH",
          url: `${apiEndpoints.userProfileUpdate}`,
          data: userProfileData,
        });
        return userUpdateResponse.data.result.response;
      } catch (error) {
        console.log(error);
        return "FAILED";
      }
    };
    const certificateReissue = async (userCertificateData, userId) => {
      try {
        const userCertificateIssueStatus = [];
        for (let i = 0; i < userCertificateData.length; i++) {
          const certificateData = userCertificateData[i];
          const courseId = certificateData.courseId;
          const batchId = certificateData.batchId;
          try {
            const query = `UPDATE sunbird_courses.user_enrolments SET issued_certificates= [] WHERE userid='${userId}' AND courseid='${courseId}' and batchid='${batchId}'`;
            await client.execute(query);
            const reissueCertificateData = {
              request: {
                courseId: courseId,
                batchId: batchId,
                userIds: [userId],
              },
            };
            const reissueResponse = await axios({
              headers: {
                Authorization: apiKey,
                "x-authenticated-user-token": xAuthenticatedToken,
              },
              method: "POST",
              url: `${apiEndpoints.certificateReissue}`,
              data: reissueCertificateData,
            });
            userCertificateIssueStatus.push(`${courseId}:true`);
          } catch (error) {
            userCertificateIssueStatus.push(`${courseId}:false`);
          }
        }
        return userCertificateIssueStatus;
      } catch (error) { }
    };
    const userData = JSON.parse(
      fs.readFileSync(`${__dirname}/userData.json`, "utf-8")
    );
    for (let k = 0; k < userData.length; k++) {
      const userStatus = {
        profileUpdate: "",
        reissueCertificateDetails: [],
      };
      const userId = userData[k].userId;
      const firstName = userData[k].profileDetails.firstName;
      const lastName = userData[k].profileDetails.lastName;
      const regNurseRegMidwifeNumber =
        userData[k].profileDetails.regNurseRegMidwifeNumber;
      const actions = userData[k].actions;
      const profileUpdateRequired =
        actions[0] == "updateProfile" ? true : false;
      const reissueCertificateRequired =
        actions[1] == "reissueCertificate" ? true : false;
      // "actions": ["updateProfile", "reissueCertificate"],
      if (profileUpdateRequired) {
        const userProfileUpdaterResponse = await userProfileUpdater(
          userId,
          firstName,
          lastName,
          regNurseRegMidwifeNumber
        );
        userStatus.profileUpdate =
          userProfileUpdaterResponse == "SUCCESS" ? "SUCCESS" : "FAILED";
      }
      if (reissueCertificateRequired) {
        const certificateIssueResponse = certificateReissue(
          userData[k].courseDetails,
          userId
        );
        userStatus.reissueCertificateDetails = await certificateIssueResponse;
      }
      fs.appendFile(
        "courseLogs.txt",
        `UserId ${userId} userProfileUpdateStatus ${userStatus.profileUpdate} courseId ${userStatus.reissueCertificateDetails}\n`,
        function (err) {
          if (err) throw err;
          console.log("Saved!");
        }
      );
    }
    res.status(200).json({
      message: "success",
    });
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
});
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
