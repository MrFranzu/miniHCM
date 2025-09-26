// api/punch.js
export default function handler(req, res) {
  if (req.method === "POST") {
    const { type } = req.body;

    // TODO: save punch in DB (e.g., Firestore)
    res.status(200).json({ success: true, message: "Punch recorded", type });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
