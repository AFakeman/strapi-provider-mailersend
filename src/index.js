"use strict";

const assert = require('node:assert');
const mailersend = require('mailersend');

const parseEmail = require('./utils/parseEmail');

const main = {
  provider: 'strapi-provider-mailersend',
  name: 'MailerSend Provider',
  init(providerOptions, settings) {
    // Assert the providerOptions are valid
    assert(providerOptions.apiKey, 'Mailersend API key is required');

    // Initialize the provider
    const mailerSend = new mailersend.MailerSend({
      apiKey: providerOptions.apiKey,
    });

    return {
      async send(options) {
        // Parsing emails to extract name and email
        const parsedFrom = parseEmail(options.from ?? settings.defaultFrom);
        const parsedReplyTo = parseEmail(options.replyTo ?? settings.defaultReplyTo);
        const parsedTo = parseEmail(options.to);

        const sentFrom = new mailersend.Sender(parsedFrom.email, parsedFrom.name);

        const replyTo = new mailersend.Sender(parsedReplyTo.email, parsedReplyTo.name);

        const recipients = [new mailersend.Recipient(parsedTo.email, parsedTo.name)];

        const emailParams = new mailersend.EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setReplyTo(replyTo)
          .setSubject(options.subject)
          .setHtml(options.html || options.text)
          .setText(options.text || options.html);

        if ('attachments' in options) {
          const attachments = options.attachments.map((item) => new mailersend.Attachment(
            item.content,
            item.filename,
            'attachment',
          ));
          emailParams.setAttachments(attachments);
        }

        try {
          const response = await mailerSend.email.send(emailParams);
          return response;
        } catch (error) {
          throw new Error('Mailersend error: ' + error.body.message);
        }
      },
    };
  },
};

module.exports = main;
