// api/admin/dailyReport.js
export default function handler(req, res) {
  if (req.method === "POST") {
    const { date } = req.body;

    // TODO: generate daily report
    res.status(200).json({ success: true, report: { date } });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
