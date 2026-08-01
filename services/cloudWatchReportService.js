const {
  CloudWatchLogsClient,
  StartQueryCommand,
  GetQueryResultsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");

const client = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || "ap-south-2",
});

async function getApiSummary() {
  const logGroupName = process.env.LOG_GROUP_NAME;

  // Last 24 hours
  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - 24 * 60 * 60;

  const query = `
fields route, method, duration
| filter ispresent(route)
| stats
    count(*) as requests,
    round(avg(duration),0) as avgDuration
by method, route
| sort requests desc
`;

  const start = await client.send(
    new StartQueryCommand({
      logGroupName,
      startTime,
      endTime,
      queryString: query,
    }),
  );

  let result;

  while (true) {
    result = await client.send(
      new GetQueryResultsCommand({
        queryId: start.queryId,
      }),
    );

    if (result.status === "Complete") break;

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(JSON.stringify(result, null, 2));

  const data = parseResults(result.results);

  return buildSummary(data);
}

function parseResults(results) {
  return results.map((row) => {
    const obj = {};

    row.forEach((field) => {
      obj[field.field] = field.value;
    });

    return obj;
  });
}
function buildSummary(data) {
  const summary = {
    totalRequests: 0,
    totalEndpoints: 0,

    mostUsedEndpoint: null,
    slowestEndpoint: null,
    fastestEndpoint: null,

    endpoints: [],
  };

  for (const row of data) {
    const endpoint = {
      method: row.method,
      route: row.route,
      requests: Number(row.requests),
      avgDuration: Number(row.avgDuration),
    };

    summary.totalRequests += endpoint.requests;
    summary.endpoints.push(endpoint);

    // Most used
    if (
      !summary.mostUsedEndpoint ||
      endpoint.requests > summary.mostUsedEndpoint.requests
    ) {
      summary.mostUsedEndpoint = endpoint;
    }

    // Slowest
    if (
      !summary.slowestEndpoint ||
      endpoint.avgDuration > summary.slowestEndpoint.avgDuration
    ) {
      summary.slowestEndpoint = endpoint;
    }

    // Fastest
    if (
      !summary.fastestEndpoint ||
      endpoint.avgDuration < summary.fastestEndpoint.avgDuration
    ) {
      summary.fastestEndpoint = endpoint;
    }
  }

  summary.endpoints.sort((a, b) => b.requests - a.requests);

  summary.totalEndpoints = summary.endpoints.length;

  return summary;
}

module.exports = {
  getApiSummary,
};
