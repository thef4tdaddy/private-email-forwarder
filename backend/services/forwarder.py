import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.message import EmailMessage

class EmailForwarder:
    @staticmethod
    def forward_email(original_email_data: dict, target_email: str):
        sender_email = os.environ.get("SENDER_EMAIL")
        password = os.environ.get("SENDER_PASSWORD")
        smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = 587

        if not sender_email or not password:
            # Fallback to first account in EMAIL_ACCOUNTS
            import json
            try:
                accounts_json = os.environ.get("EMAIL_ACCOUNTS")
                if accounts_json:
                    accounts = json.loads(accounts_json)
                    if accounts and isinstance(accounts, list):
                        first_acc = accounts[0]
                        sender_email = first_acc.get("email")
                        password = first_acc.get("password")
                        # Also override SMTP server if provided in account, otherwise keep env default
                        # Note: We prioritize the account's specific server if we are using the account's creds
                        # But to keep it simple, we'll likely rely on SMTP_SERVER env or standard mapping.
                        # Actually, let's use the account's server if available? 
                        # The user might be mixing Gmail and iCloud.
                        # If we pick the first account, we should probably stick to standard SMTP unless defined.
                        # For now, let's just get the creds.
            except:
                pass

        if not sender_email or not password:
            print("❌ SMTP Credentials missing (SENDER_EMAIL or EMAIL_ACCOUNTS)")
            return False

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = target_email
        msg['Subject'] = f"Fwd: {original_email_data.get('subject', 'No Subject')}"

        # Create body
        body_text = f"Forwarding receipt from {original_email_data.get('from')}:\n\n"
        body_text += original_email_data.get('body', '')
        
        msg.attach(MIMEText(body_text, 'plain'))

        try:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, password)
                server.send_message(msg)
            print(f"✅ Email forwarded to {target_email}")
            return True
        except Exception as e:
            print(f"❌ Error forwarding email: {e}")
            return False
