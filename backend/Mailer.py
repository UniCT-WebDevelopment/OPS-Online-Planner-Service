#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import smtplib
import logging

from os.path import basename
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(name)s - [%(funcName)s]: %(message)s", datefmt="%d/%m/%Y %H:%M:%S", level=logging.INFO,
)


class Mailer:
    def __init__(self, smtp, port, email, password, html_template):
        self.smtp = smtp
        self.port = port
        self.email = email
        self.password = password

        self.html_template = html_template

        self.logger = logging.getLogger("MAILER")

    def send_mail(self, email, username, text, subject, html=None, file_attach=None):
        try:
            self.logger.info("Going to send email to: {}, subject: {}".format(email, subject))

            # Login with smtplib
            smtpserver = smtplib.SMTP(str(self.smtp), int(self.port))
            smtpserver.ehlo()
            smtpserver.starttls()
            smtpserver.login(self.email, self.password)

            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = "OPS - Online Planner Service"
            message["To"] = "{} <{}>\n".format(username, email)

            part1 = MIMEText(text, "plain")
            message.attach(part1)

            if html is not None:
                part2 = MIMEText(html, "html")
                message.attach(part2)

            if file_attach is not None:
                with open(file_attach, "rb") as _file:
                    part3 = MIMEApplication(_file.read(), Name=basename(file_attach))
                    part3["Content-Disposition"] = 'attachment; filename="%s"' % basename(file_attach)
                    message.attach(part3)

            smtpserver.sendmail(self.email, email, message.as_string())
            smtpserver.quit()
            self.logger.info("Email sent successfully to: {}".format(email))

        except Exception as e:
            self.logger.error("Mail error={}".format(e))

    def build_html_mail(self, title, body, htmlfile=None):
        html_template = open("{}/email.html".format(self.html_template) if htmlfile is None else htmlfile, "r",).read()
        html = html_template.replace("{{title}}", title).replace("{{body}}", body)
        return html
