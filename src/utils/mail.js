import mailgen from "mailgen"

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
    forgotPasswordMailgenContent
}