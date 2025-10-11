const sgMail = require("@sendgrid/mail");
const fs = require("fs");
const path = require("path");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function replaceContent(content, creds) {
  return Object.keys(creds).reduce((updatedContent, key) => {
    return updatedContent.replace(new RegExp(`#{${key}}`, "g"), creds[key]);
  }, content);
}

async function EmailHelper(templateName, receiverEmail, creds) {
  try {
    const templatePath = path.join(__dirname, "email_templates", templateName);
    let content = await fs.promises.readFile(templatePath, "utf-8");
    content = replaceContent(content, creds);

    const msg = {
      to: receiverEmail,
      from: process.env.SENDGRID_SENDER,
      subject: "Mail from Scaler BookMyShow",
      html: content,
    };

    await sgMail.send(msg);
    console.log("Email sent via SendGrid");
  } catch (err) {
    console.error("Error sending email:", err.message);
  }
}

module.exports = EmailHelper;
