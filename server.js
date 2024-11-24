import express from "express";
import dotenv from "dotenv";
import fs from "fs-extra";
import archiver from "archiver";
import path from "path";
import { fileURLToPath } from "url";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = 5000;

// // Initialize Vercel AI with OpenAI as the provider
// const openai = new OpenAI(process.env.AI_API_KEY);

app.use(express.json());

// Endpoint to handle prompt and return a ZIP file
app.post("/api/generate-code", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    // Generate code with Vercel AI (OpenAI as backend provider)
    // const response = await openai.complete({
    //   prompt: `Generate boilerplate code based on the following prompt: ${prompt}`,
    //   maxTokens: 1500,
    //   temperature: 0.5,
    // });
    const { text } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      prompt: prompt,
    });

    const generatedCode = text;
    console.log(text);

    // Define folder paths
    const outputDir = path.join(__dirname, "generated_code");
    const zipFilePath = path.join(outputDir, "boilerplate.zip");

    // Create code files
    await fs.ensureDir(outputDir);
    const filePath = path.join(outputDir, "README.md");
    await fs.writeFile(filePath, generatedCode);

    // Create ZIP file
    const archive = archiver("zip", { zlib: { level: 9 } });
    const zipStream = fs.createWriteStream(zipFilePath);

    archive.pipe(zipStream);
    archive.file(filePath, { name: "README.md" });
    await archive.finalize();

    // Serve the ZIP file
    zipStream.on("close", async () => {
      res.download(zipFilePath, "boilerplate.zip", async (err) => {
        if (err) {
          console.error("Error downloading file:", err);
        }
        // Clean up temporary files
        await fs.remove(outputDir);
      });
    });
  } catch (error) {
    console.error("Error generating code:", error.message);
    res.status(500).json({ error: "Failed to generate code." });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
