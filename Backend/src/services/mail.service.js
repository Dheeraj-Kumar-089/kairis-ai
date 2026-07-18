import Mailjet from "node-mailjet";

const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_API_SECRET
);

export async function sendEmail({ to, subject, html, text }) {

    try {
        await mailjet.post("send", { version: "v3.1" }).request({
            Messages: [
                {
                    From: {
                        Email: process.env.MAILJET_SENDER_EMAIL,
                        Name: process.env.MAILJET_SENDER_NAME || "Kairis AI",
                    },
                    To: [{ Email: to }],
                    Subject: subject,
                    HTMLPart: html,
                    TextPart: text,
                },
            ],
        });
    } catch (error) {
        
        const detail = error?.response?.body ? JSON.stringify(error.response.body) : error.message;
        throw new Error(detail || "Failed to send email via Mailjet");
    }

    console.log("Email sent via Mailjet to:", to);
}
