const fs = require("fs");
const http = require("http");
const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const { uid } = require("uid");
const config = require("./config.json");

if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir);

app.use(fileUpload());

app.use("/i", express.static(config.uploadDir));

app.post("/uploadd/:a/:b/", function (req, res) {
	console.log("masuk request baru");

	if (!req.files) {
		return res.status(500).send("No file uploaded");
	}

	let mainFile = null;

	// cari file yg bukan "thumb"
	for (let k in req.files) {
		const file = req.files[k];
		if (file.name.indexOf("thumb") === -1) {
			mainFile = file;
			break;
		}
	}

	if (!mainFile) {
		return res.status(400).send("No main file uploaded");
	}

	const split = mainFile.name.split(".");
	const ext = split.pop();

	let fileName = uid(8) + "." + ext;

	while (fs.existsSync(config.uploadDir + "/" + fileName)) {
		fileName = uid(8) + "." + ext; // (tadi ada extra ')' di kode kamu)
	}

	mainFile.mv(config.uploadDir + "/" + fileName, function (err) {
		if (err) {
			console.error("Error saat move file:", err);
			return res.status(500).send(err);
		}

		const url = config.baseUrl2.replace("{{filename}}", fileName);
		const body = `<response><status>success</status><share>${url}</share></response>\n`;

		return res.send(body); // HANYA di sini kirim response
	});
});


app.get("/", (req, res) => {
	res.send("Lightshot server is running, cokkkkk");
});

app.g;

http.createServer(app).listen(config.listenPort, () => {
	console.log("lightshot http server started on port " + config.listenPort);
});
