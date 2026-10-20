/* Site configuration. Edit here, nothing else needs to change.
   FORM_ENDPOINT: where the quote / contact forms POST (JSON).
   The default is FormSubmit's AJAX endpoint keyed by your inbox address:
   the first submission sends that inbox a one-time activation email.
   Replace with your own handler (PHP, Worker, CRM webhook) when ready. */
window.WWAL = {
  FORM_ENDPOINT: "https://formsubmit.co/ajax/jasonmiz@me.com",
  THANK_YOU_URL: "thank-you.html",
  BRAND: "Worldwide Auto Leasing",
  PHONE: "(732) 534-4430",
  SMS_PROGRAM: "Worldwide Auto Leasing Alerts",
  CREDIT_APP_URL: "https://xdsk.pro/iC37om"
};
