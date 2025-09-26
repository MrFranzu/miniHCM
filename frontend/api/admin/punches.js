// api/admin/punches.js
export default function handler(req, res) {
  if (req.method === "GET") {
    // TODO: fetch punches from DB
    res.status(200).json({ success: true, punches: [] });
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
