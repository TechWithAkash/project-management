import Mailgen from "mailgen";
import nodemailer from "nodemailer"

const sendEmail = async (options) => {

    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "taskmanager",
            link: "https://mywealthwise.tech"
        }
    });

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHTML = mailGenerator.generate(options.mailgenContent);

    // ✅ FIX 1: Define transporter
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: Number(process.env.MAILTRAP_SMTP_PORT),
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASSWORD // ✅ FIX 3
        }
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHTML,
    };

    try {
        // ✅ FIX 2: sendMail (NOT sendEmail)
        await transporter.sendMail(mail);
        console.log("✅ Email sent successfully");
    } catch (error) {
        console.error("❌ Email Service Failed");
        console.error(error);
    }
};




const emailVerficationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our app! we're excited to have you on board",
            action: {
                instructions: "To verify you're mail pls click on the button",
                button: {
                    color: "#0dbe59ff",
                    text: "verify you're mail",
                    link: verificationUrl,
                },
            },
            outro:
                "Need Help or Have questions? Just reply to these mail we would love to help."
        },
    };
};


const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "Reset Password Request",
            action: {
                instructions: "To reset you're password pls click on the button",
                button: {
                    color: "#0dbe59ff",
                    text: "Reset Password",
                    link: passwordResetUrl,
                },
            },
            outro:
                "Need Help or Have questions? Just reply to these mail we would love to help."
        },
    };
};

export {
    emailVerficationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail
}