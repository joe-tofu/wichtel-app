const express = require("express");
const fs = require("fs/promises");

const app = express();
const PORT = 3000;

// JSON-Datei für Daten
const DATA_FILE = "./data.json";

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Ausschlussregeln
const exclusions = {
	Anne: ["Daniel"],
	Daniel: ["Anne"],
	Nadine: ["Jörg"],
	Jörg: ["Nadine"],
};

// Hilfsfunktion: Daten lesen und schreiben
async function getData() {
	try {
		const data = await fs.readFile(DATA_FILE, "utf8");
		return JSON.parse(data);
	} catch {
		// Falls Datei fehlt, initialisiere Daten
		return { names: [], pairs: {} };
	}
}

async function saveData(data) {
	await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

// Endpoint: Wichtelpartner auslosen
app.post("/draw", async (req, res) => {
	const { name } = req.body;
	console.log("Eingehender Name:", name);

	const data = await getData();
	console.log("Aktuelle Daten aus der Datei:", data);

	// Prüfen, ob der Name in der Liste der Teilnehmer ist
	if (!data.names.includes(name)) {
		console.log("Unbekannter Name:", name);
		return res.status(400).json({ message: "Unbekannter Name." });
	}

	// Prüfen, ob der Benutzer bereits einen Partner hat
	if (data.pairs[name]) {
		const partner = data.pairs[name]; // Partner aus den gespeicherten Paaren holen
		console.log(`Partner für ${name} existiert bereits:`, partner);
		return res.json({
			message: `${partner} ist dein Wichtelpartner.`, // Partner korrekt zurückgeben
			receiver: partner, // Partner explizit auch als separaten Key senden
		});
	}

	// Verfügbare Empfänger unter Berücksichtigung der Ausschlussregeln filtern
	const availableReceivers = shuffleArray(
		data.names.filter(
			(n) =>
				n !== name &&
				!Object.values(data.pairs).includes(n) &&
				!(exclusions[name] || []).includes(n)
		)
	);

	console.log("Verfügbare Empfänger für", name, ":", availableReceivers);

	// Prüfen, ob Empfänger verfügbar sind
	if (availableReceivers.length === 0) {
		console.log("Keine Empfänger verfügbar für:", name);
		return res
			.status(400)
			.json({ message: "Keine Wichtelpartner mehr verfügbar." });
	}

	// Zufälligen Empfänger auswählen
	const receiver =
		availableReceivers[Math.floor(Math.random() * availableReceivers.length)];
	console.log("Ausgewählter Empfänger für", name, ":", receiver);

	data.pairs[name] = receiver; // Partner zuweisen
	await saveData(data); // Daten speichern

	console.log("Aktualisierte Paare:", data.pairs);

	// Ausgabe des zugewiesenen Partners
	res.json({
		message: `${receiver} ist dein Wichtelpartner.`, // Klartextnachricht
		receiver, // Partner explizit als Key senden
	});
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
