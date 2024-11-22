const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Création de la table `articles` si elle n'existe pas
pool
  .query(
    `CREATE TABLE IF NOT EXISTS articles(
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL
  )`
  )
  .then(() =>
    console.log("La table articles a été créée ou est déjà existante.")
  )
  .catch((err) =>
    console.error(
      `Une erreur s'est produite lors de la tentative de création de la table articles : ${err}.`
    )
  );

// Route POST pour créer un nouvel article
app.post("/articles", async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const result = await pool.query(
      "INSERT INTO articles (title, content, author) VALUES ($1, $2, $3) RETURNING *",
      [title, content, author]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur lors de la création de l'article.",
    });
  }
});

// Route GET pour récupérer tous les articles
app.get("/articles", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM articles ORDER BY id ASC");

    if (result.rows.length <= 0 || !result.rows) {
      throw new Error("La table articles est vide ou inexistante.");
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: `Une erreur s'est produite lors de la tentative de récupération des articles : ${err}.`,
    });
  }
});

// Route PATCH pour mettre à jour un article
app.patch("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author } = req.body;

    const result = await pool.query(
      "UPDATE articles SET title = $1, content = $2, author = $3 WHERE id = $4 RETURNING *",
      [title, content, author, id]
    );

    if (result.rows.length === 0) {
      throw new Error("Article introuvable ou non mis à jour.");
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      message: `Une erreur s'est produite lors de la mise à jour de l'article : ${err}`,
    });
  }
});

// Route DELETE pour supprimer un article
app.delete("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM articles WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error("Article introuvable ou non supprimé.");
    }

    res.json({
      message: "Article supprimé avec succès.",
      deletedArticle: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      message: `Une erreur s'est produite lors de la suppression de l'article : ${err}`,
    });
  }
});

// Démarrage du serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
