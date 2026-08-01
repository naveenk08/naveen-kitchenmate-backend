const { getApiSummary } = require("./services/cloudWatchReportService");
const { buildReport } = require("./services/reportTemplateService");
const { sendEmail } = require("./services/emailService");

exports.handler = async () => {
  console.log("Starting Daily Report...");

  const summary = await getApiSummary();
  console.log(summary);

  const html = buildReport(summary);

  await sendEmail(
    `Kitchenmate API Report - ${new Date().toLocaleDateString("en-IN")}`,
    html
  );

  console.log("Daily report sent.");
  return {
    statusCode: 200,
    body: "Done",
  };
};
