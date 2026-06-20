import os
import smtplib
import logging
from email.mime.text import MIMEText
from typing import Optional, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AlertService")

class AlertService:
    """
    Industrial Safety Alert Notification Service.
    Supports formatted console alarm indicators, simulated or real SMTP email dispatches,
    and simulated or real Telegram Bot alert webhooks.
    """
    
    def __init__(
        self,
        risk_threshold: float = 70.0,
        smtp_host: str = "smtp.gmail.com",
        smtp_port: int = 587,
        sender_email: Optional[str] = None,
        sender_password: Optional[str] = None,
        recipient_email: Optional[str] = None,
        telegram_token: Optional[str] = None,
        telegram_chat_id: Optional[str] = None
    ):
        self.risk_threshold = risk_threshold
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        
        # Load from arguments or look up standard workspace environment variables
        self.sender_email = sender_email or os.getenv("FACTORY_SENDER_EMAIL")
        self.sender_password = sender_password or os.getenv("FACTORY_SENDER_PASSWORD")
        self.recipient_email = recipient_email or os.getenv("FACTORY_RECIPIENT_EMAIL")
        self.telegram_token = telegram_token or os.getenv("FACTORY_TELEGRAM_TOKEN")
        self.telegram_chat_id = telegram_chat_id or os.getenv("FACTORY_TELEGRAM_CHAT_ID")
        
        logger.info(f"Notification Alert System configured with threshold score of {self.risk_threshold}.")

    def _trigger_console_alert(self, message: str, level: str):
        """Displays highly noticeable console logs with color-themed ASCII boundaries."""
        border = "=" * 60
        if level.upper() == "CRITICAL" or level.upper() == "HIGH":
            logger.error("\n" + border)
            logger.error(f"🚨 [CRITICAL ALERT] CLASSIFICATION LEVEL: {level.upper()}")
            logger.error(f"🚨 HAZARD DETAILS: {message}")
            logger.error(border + "\n")
        elif level.upper() == "WARNING" or level.upper() == "MEDIUM":
            logger.warning("\n" + border)
            logger.warning(f"⚠️ [WARNING ALERT] CLASSIFICATION LEVEL: {level.upper()}")
            logger.warning(f"⚠️ METRIC WARNING: {message}")
            logger.warning(border + "\n")
        else:
            logger.info(f"ℹ️ [INFO MESSAGE] Level: {level} - {message}")

    def _trigger_smtp_email(self, message: str, level: str):
        """Sends physical email notification. Falls back cleanly to high-fidelity simulation if credentials aren't configured."""
        subject = f"[SAFE-GUARD ALERT] Status Code: {level.upper()} - Action Required"
        body = f"""
============================================================
INDUSTRIAL SAFETY ALARM TELEMETRY INCIDENT DISPATCH
============================================================
Hazard Level   : {level.upper()}
Trigger Reason : {message}
Timestamp      : {logging.Formatter.formatTime}
Nodal Status   : WARNING/DANGER CRITERIA BREACHED

This is an automated industrial safey dispatch. Please audit camera video feeds and evacuate active zones if sirens are sounding.
"""
        
        if self.sender_email and self.sender_password and self.recipient_email:
            try:
                msg = MIMEText(body)
                msg["Subject"] = subject
                msg["From"] = self.sender_email
                msg["To"] = self.recipient_email
                
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_mail(self.sender_email, [self.recipient_email], msg.as_string())
                logger.info(f"Real SMTP Email dispatched securely to '{self.recipient_email}'.")
            except Exception as e:
                logger.error(f"SMTP Dispatch failed: {e}. Executing simulation notification safeguard fallback instead.")
                self._simulate_email_log(subject, body)
        else:
            self._simulate_email_log(subject, body)

    def _simulate_email_log(self, subject: str, body: str):
        """Simulates physical email output logs for zero-hardware development configurations."""
        logger.info("📧 [EMAIL SERVICE SIMULATOR - credentials missing or inactive]")
        logger.info(f"   To      : {self.recipient_email or 'production-safety-officer@industrial-factory.com'}")
        logger.info(f"   Subject : {subject}")
        logger.info("   Content :")
        for line in body.strip().split("\n"):
            logger.info(f"     | {line}")
        logger.info("-" * 55)

    def _trigger_telegram_webhook(self, message: str, level: str):
        """Dispatches an instant message payload to a Telegram channels/groups. Falls back to mock logs if tokens are missing."""
        emoji = "🚨" if level.upper() in ["CRITICAL", "HIGH"] else "⚠️"
        telegram_text = f"{emoji} *Industrial Safety Alert* {emoji}\n\n*Level*: `{level.upper()}`\n*Report*: {message}"
        
        if self.telegram_token and self.telegram_chat_id:
            try:
                import requests
                url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
                payload = {
                    "chat_id": self.telegram_chat_id,
                    "text": telegram_text,
                    "parse_mode": "Markdown"
                }
                response = requests.post(url, json=payload, timeout=5)
                if response.status_code == 200:
                    logger.info("Telegram notification payload delivered successfully.")
                else:
                    logger.warning(f"Telegram Bot server returned status {response.status_code}. Executing simulation backup.")
                    self._simulate_telegram_log(telegram_text)
            except Exception as e:
                logger.error(f"Telegram webhook connection error: {e}. Executing simulator.")
                self._simulate_telegram_log(telegram_text)
        else:
            self._simulate_telegram_log(telegram_text)

    def _simulate_telegram_log(self, text: str):
        """Render precise mockup logs of Telegram Messenger Delivery payloads."""
        logger.info("💬 [TELEGRAM BOT SIMULATOR - chatbot API token or chat ID missing]")
        logger.info("   Mock Webhook Post -> https://api.telegram.org/bot[REDACTED]/sendMessage")
        for line in text.split("\n"):
            logger.info(f"     > {line}")
        logger.info("-" * 55)

    def send_alert(self, message: str, level: str):
        """
        Consolidated alerting dispatch pipeline.
        Invokes all registered notification subsystems.
        """
        # 1. Console Output Indicator
        self._trigger_console_alert(message, level)
        
        # 2. Simulated/Real SMTP Email Dispatcher
        self._trigger_smtp_email(message, level)
        
        # 3. Simulated/Real Telegram Webhook Dispatcher
        self._trigger_telegram_webhook(message, level)

# Instantiate Global Singleton alert service context
alert_service = AlertService()

def send_alert(message: str, level: str):
    """
    Global reusable helper helper function to trigger multiple alarms on demand.
    Perfect endpoint for scripts, API handlers, or detectors.
    """
    alert_service.send_alert(message, level)

if __name__ == "__main__":
    logger.info("Testing Industrial Alert notification pipelines with mock signals...")
    send_alert("High vibration peaks detected on turbine spindle 4B.", "WARNING")
    send_alert("Active physical flame detected near container storage facility.", "CRITICAL")
