document.getElementById("draw").addEventListener("click", async () => {
	const name = document.getElementById("name").value.trim();

	if (!name) {
		alert("Bitte gib deinen Namen ein.");
		return;
	}

	try {
		const response = await fetch("/draw", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name }),
		});

		if (response.ok) {
			const data = await response.json();
			document.getElementById(
				"result"
			).textContent = `Dein Wichtelpartner ist: ${data.receiver}`;
		} else {
			const error = await response.json();
			alert(error.message);
		}
	} catch (err) {
		alert("Ein Fehler ist aufgetreten.");
	}
});
