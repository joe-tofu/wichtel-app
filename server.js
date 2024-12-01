const express = require("express");
const fs = require("fs/promises");

const app = express();
const PORT = 3000;

// JSON-Datei für Daten
const DATA_FILE = "./data.json";

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Hilfsfunktion: Daten lesen und schreiben
async function getData() {
	try {
		const data = await fs.readFile(DATA_FILE, "utf8");
		return JSON.parse(data);
	} catch {
		return { names: [], pairs: {} };
	}
}

async function saveData(data) {
	await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Endpoint: Wichtelpartner auslosen
app.post("/draw", async (req, res) => {
	const { name } = req.body;
	const data = await getData();

	if (!data.names.includes(name)) {
		return res.status(400).json({ message: "Unbekannter Name." });
	}

	if (data.pairs[name]) {
		return res
			.status(400)
			.json({ message: "Du hast bereits einen Wichtelpartner." });
	}

	const availableReceivers = data.names.filter(
		(n) => n !== name && !Object.values(data.pairs).includes(n)
	);

	if (availableReceivers.length === 0) {
		return res
			.status(400)
			.json({ message: "Keine Wichtelpartner mehr verfügbar." });
	}

	const receiver =
		availableReceivers[Math.floor(Math.random() * availableReceivers.length)];
	data.pairs[name] = receiver;

	await saveData(data);

	res.json({ receiver });
});

// Startserver
app.listen(PORT, async () => {
	const data = await getData();

	// Initialisiere Daten, falls nötig
	if (data.names.length === 0) {
		data.names = ["Anne", "Daniel", "Andy", "Nadine", "Jörg"];
		await saveData(data);
	}

	console.log(`Server läuft auf http://localhost:${PORT}`);
});
