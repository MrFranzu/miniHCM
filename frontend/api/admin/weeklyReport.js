// api/admin/weeklyReport.js
export default function handler(req, res) {
  if (req.method === "POST") {
    const { startDate, endDate } = req.body;

    // TODO: generate weekly report
    res.status(200).json({ success: true, report: { startDate, endDate } });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
