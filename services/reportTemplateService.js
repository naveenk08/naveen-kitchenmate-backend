function formatDuration(ms) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatNumber(n) {
  return n.toLocaleString("en-IN");
}

const METHOD_COLORS = {
  GET: "#1976d2",
  POST: "#2e7d32",
  PUT: "#f57c00",
  PATCH: "#7b1fa2",
  DELETE: "#c62828",
};

function methodColor(method) {
  return METHOD_COLORS[method.toUpperCase()] || "#555555";
}

function buildReport(summary) {
  const now = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Sort by request volume so the busiest endpoints float to the top
  const sortedEndpoints = [...summary.endpoints].sort(
    (a, b) => b.requests - a.requests,
  );
  const maxRequests = sortedEndpoints[0] ? sortedEndpoints[0].requests : 1;

  const endpointRows = sortedEndpoints
    .map((e, index) => {
      const pct = Math.max(4, Math.round((e.requests / maxRequests) * 100));
      const color = methodColor(e.method);
      const isTop = index === 0;

      return `
      <div class="endpoint-row">
        <table class="row-head" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="left">
              <span class="rank">${index + 1}</span>
              <span class="badge" style="background:${color};">${e.method}</span>
            </td>
            <td align="right" class="count">${formatNumber(e.requests)}</td>
          </tr>
        </table>
        <div class="route">${e.route}${isTop ? ' <span class="top-tag">Most used</span>' : ""}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${color};"></div>
        </div>
      </div>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>

body{
    font-family:Arial,Helvetica,sans-serif;
    background:#f4f6f8;
    margin:0;
    padding:25px;
}

.container{
    max-width:900px;
    margin:auto;
    background:white;
    border-radius:10px;
    overflow:hidden;
    box-shadow:0 2px 10px rgba(0,0,0,.08);
}

.header{
    background:#1976d2;
    color:white;
    padding:20px;
}

.header h2{
    margin:0;
    font-size:22px;
}

.header p{
    margin-top:6px;
    opacity:.9;
    font-size:14px;
}

.summary{
    padding:10px;
    width:100%;
}

.cards{
    width:90%;
    border-collapse:collapse;
    table-layout:fixed;
}

.card{
    background:#f8fafc;
    border:1px solid #e5e7eb;
    border-radius:8px;
    padding:10px;
    text-align:center;
}

.value{
    font-size:20px;
    font-weight:bold;
    color:#1976d2;
}

.label{
    color:#666;
    margin-top:6px;
    font-size:13px;
}

.section-title{
    margin:20px;
    margin-bottom:10px;
    font-size:18px;
    font-weight:bold;
}

.endpoint-list{
    padding:0 20px 10px 20px;
}

.endpoint-row{
    padding:12px 14px;
    margin-bottom:10px;
    background:#f8fafc;
    border:1px solid #ececec;
    border-radius:8px;
}

.row-head{
    width:100%;
    border-collapse:collapse;
    margin-bottom:6px;
}

.rank{
    font-size:12px;
    font-weight:bold;
    color:#999;
    margin-right:4px;
}

.badge{
    display:inline-block;
    color:white;
    font-size:11px;
    font-weight:bold;
    padding:3px 8px;
    border-radius:4px;
    letter-spacing:.03em;
}

.route{
    font-size:14px;
    color:#222;
    word-break:break-word;
    margin-bottom:8px;
}

.top-tag{
    display:inline-block;
    background:#fff3cd;
    color:#8a6d00;
    font-size:10px;
    font-weight:bold;
    text-transform:uppercase;
    letter-spacing:.03em;
    padding:2px 7px;
    border-radius:10px;
    margin-left:4px;
    white-space:nowrap;
}

.count{
    font-size:14px;
    font-weight:bold;
    color:#1976d2;
    white-space:nowrap;
}

.bar-track{
    width:100%;
    height:6px;
    background:#e9edf2;
    border-radius:4px;
    overflow:hidden;
}

.bar-fill{
    height:100%;
    border-radius:4px;
}

.footer{
    padding:15px;
    text-align:center;
    color:#888;
    font-size:12px;
}

/* ---------- Responsive rules ---------- */
@media only screen and (max-width:600px){

    body{
        padding:10px;
    }

    .container{
        border-radius:6px;
    }

    .header{
        padding:15px;
    }

    .header h2{
        font-size:18px;
    }

    .section-title{
        margin:15px;
        font-size:16px;
    }

    /* Stack the summary cards */
    .cards, .cards tr, .cards td{
        display:block;
        width:100% !important;
    }

    .cards td{
        padding-bottom:10px;
    }

    .cards td:last-child{
        padding-bottom:0;
    }

    .endpoint-list{
        padding:0 12px 6px 12px;
    }

    .route{
        font-size:13px;
    }
}

</style>

</head>

<body>

<div class="container">

<div class="header">
<h2>Kitchenmate API Daily Report</h2>
<p>${now}</p>
</div>

<div class="summary">

<table class="cards">
<tr>

<td width="40%">
<div class="card">
<div class="value">${formatNumber(summary.totalRequests)}</div>
<div class="label">Total Requests</div>
</div>
</td>

<td width="40%">
<div class="card">
<div class="value">${formatNumber(summary.totalEndpoints)}</div>
<div class="label">Unique Endpoints</div>
</div>
</td>

</tr>
</table>

</div>

<div class="section-title">
Endpoint Statistics
</div>

<div class="endpoint-list">

${endpointRows}

</div>

<div class="footer">

Generated automatically by AWS Lambda<br>
Kitchenmate Monitoring Service

</div>

</div>

</body>

</html>
`;
}

module.exports = {
  buildReport,
};