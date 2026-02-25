medication.notify.child.js --> agent for sending email notification, has two tools fetchMongo.notify.tool.agent.js & sendEmail.tool.agent.js

fetchMongo.notify.tool.agent.js --> fetch approved && active prescription data gives to ---> sendEmail.tool.agent.js

sendEmail.tool.agent.js --> sends email to user_email.

medication.notify.child.js ---> is triggered by node-cron in --> notification.schedule.js(this triggers the notification-agent)

IMAGE DATA EXTRACTOR ==>

img_data_extractor.notify.child.js --> has OCR-tool(OCR.notify.tool.agent.js) that extracts the image data and agent then formats it.

NOW CREATE A CAMERA ON FRONTEND THAT SENDS IMAGE TO BACKEND ON --> handlePrescriptionUpload from backend\src\controllers\prescription.controller.js

handlePrescriptionUpload --> router is notiifcation.routes.js, use only the /upload route, the other one is for test

