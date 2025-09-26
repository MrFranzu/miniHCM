// api/admin/editPunch.js
export default function handler(req, res) {
  if (req.method === "POST") {
    const { id, newData } = req.body;

    // TODO: update punch in DB
    res.status(200).json({ success: true, message: "Punch updated", id, newData });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
