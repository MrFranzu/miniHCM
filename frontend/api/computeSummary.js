// api/computeSummary.js
export default function handler(req, res) {
  if (req.method === "POST") {
    const { date, userId } = req.body;

    // TODO: replace with real computation logic
    res.status(200).json({
      success: true,
      message: "Summary computed",
      date,
      userId,
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
