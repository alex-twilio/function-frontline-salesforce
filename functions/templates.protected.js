const sfdcAuthenticatePath =
  Runtime.getFunctions()["auth/sfdc-authenticate"].path;
const { sfdcAuthenticate } = require(sfdcAuthenticatePath);

exports.handler = async function (context, event, callback) {
  console.log("AC  Handler Event" + JSON.stringify(event));
  let response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  try {
    console.log('Frontline user identity: ' + event.Worker);

    const sfdcConnectionIdentity = await sfdcAuthenticate(
      context,
      event.Worker
    );
    const { connection, identityInfo } = sfdcConnectionIdentity;
    console.log("Connected as SF user:" + identityInfo.username);

      switch (event.Location) {
        case 'GetTemplatesByCustomerId': {
          console.log("AC Case event.id" + JSON.stringify(event));
          response.setBody(
            // [
            //   getTemplatesByCustomerId(event.CustomerId)
            // ]
            //await 
            
            
              await getTemplatesByCustomerId(event.CustomerId, connection)
          

          );
          break;
        } default: {
          console.log('Unknown Location: ', event.Location);
          res.setStatusCode(422);
        }
      }
      return callback(null, response);
  } catch (e) {
    console.error(e);
    response.setStatusCode(500);
    return callback(null, response);
  }
};


const getTemplatesByCustomerId = async (contactId, connection) => {
  console.log("Getting Customer details: ", contactId);

  let sfdcRecords = [];
  try {
    sfdcRecords = await connection
      .sobject("Contact")
      .find(
        {
          Id: contactId,
        },
        {
          Id: 1,
          Name: 1,
          Title: 1,
          MobilePhone: 1,
          "Account.Name": 1,
          "Owner.Name": 1,
          Next_Suggested_Donation__c: 1,
          Last_Donation_Amount__c: 1,
          Event_Attendance__c: 1,
        }
      )
      .limit(1)
      .execute();
    console.log(
      "Fetched # SFDC records for customer details by ID: " + sfdcRecords.length
    );
    //console.log("contact Object : " + JSON.stringify(sfdcRecords));
  } catch (err) {
    console.error(err);
  }
  const sfdcRecord = sfdcRecords[0];

  const accountName = sfdcRecord.Account
    ? sfdcRecord.Account.Name
    : "Unknown Company";

  const contactName = sfdcRecord.Name;
  const tomorrowDate = getTomorrowsDate();
  const mobilePhone = sfdcRecord.MobilePhone;
  const email = sfdcRecord.Email;
  const contactOwner = sfdcRecord.Owner.Name;
  const eventAttendance = sfdcRecord.Event_Attendance__c;
  const lastDonation = sfdcRecord.Last_Donation_Amount__c;
  const nextDonation = sfdcRecord.Next_Suggested_Donation__c;


  const openerCategory = {
    display_name: "In Field",
    templates: [
      {
        content: `Hi ${contactName}, this is ${contactOwner} with Charity Donations. Thank you for your last donation $${lastDonation}.  I see you're not signed up for the Gala.  Are you available ${tomorrowDate} to chat?`,
        whatsAppApproved: true,
      },
    ],
  };
  const supportCategory = {
    display_name: "Support Thank you",
    templates: [
      {
        content: `${contactName}, your support has made a difference to us. We’re releasing our annual impact report soon. It would be great to meet and walk you through it before it’s public. Are you available in the next few weeks?`,
        whatsAppApproved: true,
      },
      {
        content: `Thank you ${contactName} for your last donation of $${lastDonation}. Can we count on your support this year of $${nextDonation}?`,
      },
    ],
  };
  const closingCategory = {
    display_name: "Closing",
    templates: [
      {
        content: `Thank you ${contactName} for attending our Gala. Your donation of $${lastDonation} last year made a tremendous impact. Can we count on your support this year of $${nextDonation}?`,
      },
    ],
  };

  return [openerCategory, supportCategory, closingCategory];
};


// const getTemplatesByCustomerId = (contactId) => {
//   console.log('Getting Customer templates: ', contactId);
//   return {
//     display_name: 'Meeting Reminders',
//     templates: [
//       { "content": MEETING_CONFIRM_TODAY, whatsAppApproved: true },
//       { "content": MEETING_CONFIRM_TOMORROW }
//     ]
//   };
// };

const getTodaysDate = () => {
  const today = new Date();
  console.log(today.toDateString());
  return today.toDateString();
};

const getTomorrowsDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  console.log(tomorrow.toDateString());
  return tomorrow.toDateString();
};

const MEETING_CONFIRM_TODAY = `Just a reminder that our meeting is scheduled for today on ${getTodaysDate()}`;
const MEETING_CONFIRM_TOMORROW = `Just a reminder that our meeting is scheduled for tomorrow on ${getTomorrowsDate()}`;